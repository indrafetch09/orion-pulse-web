import { Response } from 'express';
import { Server } from '../models/Server';
import { Port } from '../models/Port';
import { PortLog } from '../models/PortLog';
import { AISolution } from '../models/AISolution';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getAll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const servers = await Server.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: servers,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const serverObj = await Server.findOne({ _id: id, userId: req.user.id });

    if (!serverObj) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    return res.status(200).json({
      success: true,
      data: serverObj,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, hostname } = req.body;
    if (!name || !hostname) {
      return res.status(400).json({ success: false, message: 'Name and hostname are required' });
    }

    const newServer = await Server.create({
      name,
      hostname,
      userId: req.user.id,
      status: 'offline',
      lastHeartbeat: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: newServer,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const serverObj = await Server.findOne({ _id: id, userId: req.user.id });

    if (!serverObj) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    // Delete the server
    await Server.deleteOne({ _id: id });

    // Clean up ports associated with this server
    const ports = await Port.find({ serverId: id });
    const portIds = ports.map((p) => p._id);

    await Port.deleteMany({ serverId: id });
    await PortLog.deleteMany({ portId: { $in: portIds } });
    await AISolution.deleteMany({ portLogId: { $in: portIds } }); // Delete solutions whose portLogIds were for these ports

    return res.status(200).json({
      success: true,
      message: 'Server and all related monitored resources deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
