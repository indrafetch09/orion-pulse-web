import { Response } from 'express';
import { Port } from '../models/Port';
import { Server } from '../models/Server';
import { PortLog } from '../models/PortLog';
import { AISolution } from '../models/AISolution';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { broadcastPortUpdate, broadcastNewLog, requestAgentScan } from '../socket';
import { analyzePortFailure } from '../services/gemini';

// GET /servers/:serverId/ports
export const getAll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { serverId } = req.params;
    // Verify server belongs to user
    const serverObj = await Server.findOne({ _id: serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const ports = await Port.find({ serverId });
    return res.status(200).json({
      success: true,
      data: ports,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /servers/:serverId/ports
export const add = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { serverId } = req.params;
    const { portNumber, protocol, label } = req.body;

    if (!portNumber || !protocol || !label) {
      return res.status(400).json({ success: false, message: 'Port number, protocol, and label are required' });
    }

    const serverObj = await Server.findOne({ _id: serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const port = await Port.create({
      portNumber: Number(portNumber),
      protocol,
      label,
      serverId,
      status: 'closed',
      responseTime: 0,
      lastChecked: new Date(),
    });

    // Notify agent to update its monitoring targets
    broadcastPortUpdate(serverId, port);

    return res.status(201).json({
      success: true,
      data: port,
    });
  } catch (error: any) {
    // Handle unique constraint conflict (e.g. port already registered)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This port and protocol combination is already being monitored on this server.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /ports/:id
export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const portObj = await Port.findById(id);
    if (!portObj) {
      return res.status(404).json({ success: false, message: 'Port monitoring entry not found' });
    }

    // Verify ownership of server
    const serverObj = await Server.findOne({ _id: portObj.serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(401).json({ success: false, message: 'Unauthorized access to this resource' });
    }

    await Port.deleteOne({ _id: id });
    await PortLog.deleteMany({ portId: id });
    await AISolution.deleteMany({ portLogId: id }); // Clean up solutions for this port

    // Notify agent to stop monitoring
    broadcastPortUpdate(serverObj._id.toString(), { id, deleted: true });

    return res.status(200).json({
      success: true,
      message: 'Port and its corresponding logs deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /ports/:id/scan
export const triggerScan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const portObj = await Port.findById(id);
    if (!portObj) {
      return res.status(404).json({ success: false, message: 'Port not found' });
    }

    const serverObj = await Server.findOne({ _id: portObj.serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (serverObj.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'The local monitoring agent is currently offline. Cannot trigger an instant-scan.',
      });
    }

    // Trigger instant scan via Socket.io to the agent
    const sent = requestAgentScan(serverObj._id.toString(), {
      id: portObj._id.toString(),
      portNumber: portObj.portNumber,
      protocol: portObj.protocol,
    });

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to communicate with the local monitoring agent.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Instant-scan command dispatched to local agent. Updating dashboard soon...',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /ports/:portId/logs
export const getLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { portId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    const query: any = { portId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const logs = await PortLog.find(query)
      .sort({ checkedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await PortLog.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /ports/:portId/logs
export const clearLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { portId } = req.params;
    const portObj = await Port.findById(portId);
    if (!portObj) {
      return res.status(404).json({ success: false, message: 'Port not found' });
    }

    const serverObj = await Server.findOne({ _id: portObj.serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await PortLog.deleteMany({ portId });

    return res.status(200).json({
      success: true,
      message: 'Logs cleared successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Agent API endpoint: POST /api/agent/logs
// Used by the CLI agent to post checked logs
export const submitAgentLogs = async (req: any, res: Response) => {
  try {
    const { serverId, logs } = req.body;
    if (!serverId || !Array.isArray(logs)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const serverObj = await Server.findById(serverId);
    if (!serverObj) {
      return res.status(404).json({ success: false, message: 'Server not registered' });
    }

    // Update server status & heartbeat
    serverObj.status = 'online';
    serverObj.lastHeartbeat = new Date();
    await serverObj.save();

    const createdLogs = [];

    for (const logItem of logs) {
      const { portNumber, protocol, status, responseTime, errorMessage } = logItem;

      // Find the Port config. If not registered, create it automatically or skip.
      // Usually, the CLI monitors what we tell it, but it could report scan results.
      let portObj = await Port.findOne({ serverId, portNumber, protocol });
      if (!portObj) {
        // Auto-register port reported by CLI scan
        portObj = await Port.create({
          portNumber,
          protocol: protocol || 'TCP',
          label: `Auto-Scanned Port ${portNumber}`,
          serverId,
          status,
          responseTime,
          lastChecked: new Date(),
        });
      } else {
        // Update port status
        portObj.status = status;
        portObj.responseTime = responseTime;
        portObj.lastChecked = new Date();
        await portObj.save();
      }

      // Create PortLog entry
      const newLog = await PortLog.create({
        portId: portObj._id,
        portNumber,
        status,
        responseTime,
        errorMessage,
        checkedAt: new Date(),
      });

      createdLogs.push(newLog);

      // Trigger Gemini analysis if port is offline (closed / filtered)
      if (status !== 'open') {
        // Let it run in the background so it doesn't block agent request
        analyzePortFailure(
          newLog._id.toString(),
          portNumber,
          status,
          errorMessage
        ).then((aiSolution) => {
          // Notify dashboard when AI completes analysis
          broadcastNewLog(portObj!._id.toString(), {
            ...newLog.toJSON(),
            aiSolution,
          });
        }).catch((err) => {
          console.error(`AI analysis failed for Port ${portNumber}:`, err);
        });
      } else {
        // Just broadcast the log normal status
        broadcastNewLog(portObj._id.toString(), newLog);
      }

      // Broadcast port config change
      broadcastPortUpdate(serverId, portObj);
    }

    return res.status(200).json({
      success: true,
      message: `Logs recorded successfully. Processed ${logs.length} entries.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
