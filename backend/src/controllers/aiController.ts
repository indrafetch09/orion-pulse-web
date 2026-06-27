import { Response } from 'express';
import { AISolution } from '../models/AISolution';
import { Port } from '../models/Port';
import { Server } from '../models/Server';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// GET /ai/solutions
export const getSolutions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { portId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Retrieve user's servers
    const userServers = await Server.find({ userId: req.user.id }, '_id');
    const serverIds = userServers.map((s) => s._id);

    // Retrieve user's ports matching query or all user's ports
    const portQuery: any = { serverId: { $in: serverIds } };
    if (portId) {
      portQuery._id = portId;
    }
    const userPorts = await Port.find(portQuery, '_id');
    const portIds = userPorts.map((p) => p._id);

    // Find AI solutions that reference the user's ports
    // Since AISolution doesn't have a direct portId (it has portNumber and portLogId), we can populate the portLogId
    // and filter them or find portLogs first.
    // To make it highly efficient, let's query solutions matching the portNumbers of the user's ports.
    // Alternatively, to link perfectly, we can query AISolution and populate portLogId.
    // Let's use aggregate or a find with $in for portLogId.
    // First find all portLogIds for the selected ports:
    // Actually, we can store portId in AISolution as a premium improvement to make querying super fast.
    // Let's query based on portLogId. Since we want all solutions, we can find them and populate portLogId.
    
    // Let's fetch solutions
    const solutions = await AISolution.find({
      portNumber: { $in: userPorts.map((p) => p.portNumber) }
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'portLogId',
        select: 'status responseTime checkedAt errorMessage portId',
      });

    // Filter to ensure the populated portLog belongs to one of the user's ports
    // (This guarantees multi-tenant security)
    const secureSolutions = solutions.filter((sol: any) => {
      if (!sol.portLogId) return false;
      return portIds.some((pId) => pId.toString() === sol.portLogId.portId.toString());
    });

    const total = secureSolutions.length; // Approximate total after secure filter

    return res.status(200).json({
      success: true,
      data: secureSolutions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /ai/solutions/:id
export const getSolution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const solution = await AISolution.findById(id).populate('portLogId');

    if (!solution) {
      return res.status(404).json({ success: false, message: 'AI Solution not found' });
    }

    // Verify ownership of the server related to this solution
    const logObj: any = solution.portLogId;
    if (!logObj) {
      return res.status(404).json({ success: false, message: 'Associated port log not found' });
    }

    const portObj = await Port.findById(logObj.portId);
    if (!portObj) {
      return res.status(404).json({ success: false, message: 'Associated port config not found' });
    }

    const serverObj = await Server.findOne({ _id: portObj.serverId, userId: req.user.id });
    if (!serverObj) {
      return res.status(401).json({ success: false, message: 'Unauthorized access to this AI solution' });
    }

    return res.status(200).json({
      success: true,
      data: solution,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
