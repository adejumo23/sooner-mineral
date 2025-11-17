import { Router } from 'express';
import type { Pool } from 'mysql2/promise';
import { getCachedAssignments } from '../utils/cache.js';

export const createAssignmentsRoutes = (dbPool: Pool | null) => {
  const router = Router();

  // Get all assignments
  router.get('/api/assignments', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || '';

      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000'
        });
      }

      const allAssignments = await getCachedAssignments(dbPool);
      
      let filteredAssignments = allAssignments;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredAssignments = allAssignments.filter((assignment: any) => 
          assignment.assignedBuyer?.name?.toLowerCase().includes(searchLower) ||
          assignment.asset?.sectionName?.toLowerCase().includes(searchLower) ||
          assignment.asset?.unitName?.toLowerCase().includes(searchLower) ||
          assignment.status?.toLowerCase().includes(searchLower) ||
          assignment.notes?.toLowerCase().includes(searchLower)
        );
      }

      const totalCount = filteredAssignments.length;
      const paginatedAssignments = filteredAssignments.slice(offset, offset + limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        data: paginatedAssignments,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      });
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching assignments', 
        error: error.message 
      });
    }
  });

  // Get single assignment by ID
  router.get('/api/assignments/:id', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      const allAssignments = await getCachedAssignments(dbPool);
      const assignment = allAssignments.find((a: any) => a.id === id);
      
      if (!assignment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Assignment not found' 
        });
      }
      
      res.json(assignment);
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching assignment', 
        error: error.message 
      });
    }
  });

  // Get assignment history
  router.get('/api/assignments/:id/history', async (req, res) => {
    try {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database pool not initialized' });
      }

      const { id } = req.params;
      
      const mockHistory = [
        {
          id: 'history-1',
          assignmentId: id,
          action: 'Created',
          description: 'Assignment created and assigned to buyer',
          timestamp: '2025-09-25T03:43:56.000Z',
          userId: 'system',
          userName: 'System'
        },
        {
          id: 'history-2',
          assignmentId: id,
          action: 'Status Changed',
          description: 'Status changed from Active to Cancelled',
          timestamp: '2025-09-25T04:00:00.000Z',
          userId: 'josh',
          userName: 'JOSH'
        }
      ];
      
      res.json(mockHistory);
    } catch (error: any) {
      console.error('Error fetching assignment history:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching assignment history', 
        error: error.message 
      });
    }
  });

  return router;
};

