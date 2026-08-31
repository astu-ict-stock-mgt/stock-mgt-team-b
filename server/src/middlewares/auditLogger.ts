import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../modules/audit-log/service.ts';

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      // If the request was authenticated and didn't fail
      if (req.user && res.statusCode >= 200 && res.statusCode < 400) {
        let action = req.method;
        if (req.method === 'POST') action = 'CREATE';
        else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        else if (req.method === 'DELETE') action = 'DELETE';

        // Derive entity from base URL (e.g., /api/inventory -> inventory)
        const pathSegments = (req.baseUrl || req.path).split('/').filter(Boolean);
        const entity = pathSegments[pathSegments.length - 1] || 'system';

        // Try to capture entityId
        const entityId = req.params.id || (req.body && req.body.id) || undefined;

        // Sanitize sensitive info from details
        const details = { ...(req.body || {}) };
        delete details.password;
        delete details.passwordHash;

        createAuditLog({
          userId: req.user.id,
          action,
          entity,
          entityId,
          details: {
            ...details,
            method: req.method,
            originalUrl: req.originalUrl,
            statusCode: res.statusCode
          },
        }).catch(err => {
          console.error('AuditLog Error:', err);
        });
      }
    });
  }
  next();
};
