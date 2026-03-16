import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as routeService from '../services/route.service';
import * as vehicleService from '../services/vehicle.service';
import * as verifService from '../services/driverVerification.service';
import ApiError from '../utils/ApiError';
import { getDirections } from '../utils/googleMaps';
import { AuthenticatedRequest } from '../middlewares/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Payload = Record<string, any>;

export const getAllRoutes = asyncHandler(async (_req: Request, res: Response) => {
  const routes = await routeService.getAllRoutes();
  res.status(200).json({ success: true, message: 'Routes retrieved successfully', data: routes });
});

export const listRoutes = asyncHandler(async (req: Request, res: Response) => {
  const result = await routeService.searchRoutes(req.query as any);
  res.status(200).json({ success: true, message: 'Routes retrieved successfully', ...result });
});

export const adminListRoutes = asyncHandler(async (req: Request, res: Response) => {
  const result = await routeService.searchRoutes(req.query as any);
  res.status(200).json({ success: true, message: 'Routes (admin) retrieved successfully', ...result });
});

export const getRouteById = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.getRouteById(req.params.id);
  if (!route) throw new ApiError(404, 'Route not found');
  res.status(200).json({ success: true, message: 'Route retrieved successfully', data: route });
});

export const getMyRoutes = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const list = await routeService.getMyRoutes(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Route retrieved successfully', data: list });
});

export const adminGetRoutesByDriver = asyncHandler(async (req: Request, res: Response) => {
  const list = await routeService.getMyRoutes(req.params.driverId);
  res.status(200).json({ success: true, message: 'retrieved successfully', data: list });
});

function enrichPayloadFromDirections(payload: Payload, directions: any, requestedWps: any[], optimize: boolean): void {
  const primary = directions.routes?.[0];
  if (!primary) return;

  const legs = primary.legs || [];
  const sumMeters = legs.reduce((a: number, l: any) => a + (l.distance?.value || 0), 0);
  const sumSeconds = legs.reduce((a: number, l: any) => a + (l.duration?.value || 0), 0);

  payload.routeSummary = primary.summary || `${legs[0]?.start_address} → ${legs.at(-1)?.end_address}`;
  payload.distance = legs.length ? legs.map((l: any) => l.distance?.text).filter(Boolean).join(' + ') : null;
  payload.duration = legs.length ? legs.map((l: any) => l.duration?.text).filter(Boolean).join(' + ') : null;
  payload.distanceMeters = sumMeters;
  payload.durationSeconds = sumSeconds;
  payload.routePolyline = primary.overview_polyline?.points || null;

  payload.steps = legs.flatMap((leg: any) =>
    (leg.steps || []).map((s: any) => ({
      html_instructions: s.html_instructions,
      distance: s.distance?.text,
      duration: s.duration?.text,
      start_location: s.start_location,
      end_location: s.end_location,
      travel_mode: s.travel_mode,
      maneuver: s.maneuver || null,
    }))
  );

  payload.waypoints = {
    requested: requestedWps,
    optimizedOrder: primary.waypoint_order || [],
    used: requestedWps.map((w: any) => w),
    optimize: Boolean(optimize),
  };
  payload.landmarks = { overview_polyline: payload.routePolyline };
}

export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const driverId = authReq.user!.sub;
  const { vehicleId, optimizeWaypoints, ...routeFields } = req.body;

  await vehicleService.getVehicleById(vehicleId, driverId);

  const payload: Payload = {
    ...routeFields,
    driverId,
    vehicleId,
    departureTime: new Date(routeFields.departureTime),
  };

  const directions = await getDirections({
    origin: payload.startLocation,
    destination: payload.endLocation,
    waypoints: routeFields.waypoints || [],
    optimizeWaypoints,
    alternatives: false,
    departureTime: payload.departureTime.toISOString(),
  });

  enrichPayloadFromDirections(payload, directions, routeFields.waypoints || [], optimizeWaypoints);

  const newRoute = await routeService.createRoute(payload as any);
  res.status(201).json({ success: true, message: 'Route created successfully', data: newRoute });
});

export const updateRoute = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const driverId = authReq.user!.sub;
  const { id } = req.params;
  const { vehicleId, optimizeWaypoints, ...routeFields } = req.body;

  const existing = await routeService.getRouteById(id);
  if (!existing) throw new ApiError(404, 'Route not found');
  if (existing.driverId !== driverId) throw new ApiError(403, 'Forbidden');
  if (existing.status === 'CANCELLED') throw new ApiError(400, 'ไม่สามารถแก้ไขเส้นทางที่ถูกยกเลิกได้');

  const hasBookings = Array.isArray(existing.bookings) && existing.bookings.length > 0;
  if (hasBookings) {
    const hasConfirmed = existing.bookings.some((b: any) => b.status === 'CONFIRMED');
    if (hasConfirmed) throw new ApiError(400, 'ไม่สามารถแก้ไขเส้นทางได้ เนื่องจากมีคำจองที่ยืนยันแล้ว (CONFIRMED)');
    const allowed = new Set(['PENDING', 'REJECTED', 'CANCELLED']);
    const allAllowed = existing.bookings.every((b: any) => allowed.has(b.status));
    if (!allAllowed) throw new ApiError(400, 'ไม่สามารถแก้ไขเส้นทางได้ เนื่องจากมีคำจองที่อยู่ในสถานะที่ไม่อนุญาต');
  }

  let newVehicleId = existing.vehicleId;
  if (vehicleId) {
    await vehicleService.getVehicleById(vehicleId, driverId);
    newVehicleId = vehicleId;
  }

  const payload: Payload = {
    ...routeFields,
    vehicleId: newVehicleId,
    ...(routeFields.departureTime && { departureTime: new Date(routeFields.departureTime) }),
  };

  const startChanged = routeFields.startLocation !== undefined && JSON.stringify(routeFields.startLocation) !== JSON.stringify(existing.startLocation);
  const endChanged = routeFields.endLocation !== undefined && JSON.stringify(routeFields.endLocation) !== JSON.stringify(existing.endLocation);
  const timeChanged = routeFields.departureTime !== undefined;
  const wpsChanged = routeFields.waypoints !== undefined && JSON.stringify(routeFields.waypoints) !== JSON.stringify(
    Array.isArray((existing as any).waypoints) ? (existing as any).waypoints : (existing as any).waypoints?.requested || []
  );
  const optimizeChanged = routeFields.optimizeWaypoints !== undefined && optimizeWaypoints !== ((existing as any).waypoints?.optimize ?? false);

  if (startChanged || endChanged || timeChanged || wpsChanged || optimizeChanged) {
    const origin = payload.startLocation ?? existing.startLocation;
    const destination = payload.endLocation ?? existing.endLocation;
    const depTime = (payload.departureTime ?? existing.departureTime).toISOString();
    const currentWps = routeFields.waypoints !== undefined
      ? (routeFields.waypoints || [])
      : (Array.isArray((existing as any).waypoints) ? (existing as any).waypoints : (existing as any).waypoints?.requested || []);
    const currentOptimize = optimizeWaypoints !== undefined ? optimizeWaypoints : ((existing as any).waypoints?.optimize ?? false);

    const directions = await getDirections({
      origin, destination,
      waypoints: currentWps,
      optimizeWaypoints: currentOptimize,
      alternatives: false,
      departureTime: depTime,
    });

    enrichPayloadFromDirections(payload, directions, currentWps, currentOptimize);
  }

  const updated = await routeService.updateRoute(id, payload as any);
  res.status(200).json({ success: true, message: 'Route updated successfully', data: updated });
});

export const deleteRoute = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const driverId = authReq.user!.sub;
  const { id } = req.params;

  const existing = await routeService.getRouteById(id);
  if (!existing) throw new ApiError(404, 'Route not found');
  if (existing.driverId !== driverId) throw new ApiError(403, 'Forbidden');
  if (existing.status === 'CANCELLED') throw new ApiError(400, 'ไม่สามารถลบเส้นทางที่ถูกยกเลิกได้');

  const result = await routeService.deleteRoute(id);
  res.status(200).json({ success: true, message: 'Route deleted successfully', data: result });
});

export const adminCreateRoute = asyncHandler(async (req: Request, res: Response) => {
  const { driverId, vehicleId, optimizeWaypoints, ...routeFields } = req.body;

  const approved = await verifService.canCreateRoutes(driverId);
  if (!approved) throw new ApiError(400, 'ไม่สามารถสร้างเส้นทางให้ไดรเวอร์ที่ยังไม่ได้ยืนยันตัวตน (ต้องมีรายการยืนยันและสถานะไม่เป็น REJECTED)');

  await vehicleService.getVehicleById(vehicleId, driverId);

  const payload: Payload = { ...routeFields, driverId, vehicleId, departureTime: new Date(routeFields.departureTime) };

  const directions = await getDirections({
    origin: payload.startLocation,
    destination: payload.endLocation,
    waypoints: routeFields.waypoints || [],
    optimizeWaypoints,
    alternatives: false,
    departureTime: payload.departureTime.toISOString(),
  });

  enrichPayloadFromDirections(payload, directions, routeFields.waypoints || [], optimizeWaypoints);

  const newRoute = await routeService.createRoute(payload as any);
  res.status(201).json({ success: true, message: 'Route (by admin) created successfully', data: newRoute });
});

export const adminUpdateRoute = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { driverId, vehicleId, optimizeWaypoints, ...routeFields } = req.body;

  const existing = await routeService.getRouteById(id);
  if (!existing) throw new ApiError(404, 'Route not found');

  let newDriverId = existing.driverId;
  let newVehicleId = existing.vehicleId;

  if (driverId) {
    const approved = await verifService.canCreateRoutes(driverId);
    if (!approved) throw new ApiError(400, 'ไม่สามารถสร้างเส้นทางให้ไดรเวอร์ที่ยังไม่ได้ยืนยันตัวตน (ต้องมีรายการยืนยันและสถานะไม่เป็น REJECTED)');
    newDriverId = driverId;
  }
  if (vehicleId) {
    await vehicleService.getVehicleById(vehicleId, driverId ? driverId : newDriverId);
    newVehicleId = vehicleId;
  }

  const payload: Payload = { ...routeFields, driverId: newDriverId, vehicleId: newVehicleId, ...(routeFields.departureTime && { departureTime: new Date(routeFields.departureTime) }) };

  const startChanged = routeFields.startLocation !== undefined && JSON.stringify(routeFields.startLocation) !== JSON.stringify(existing.startLocation);
  const endChanged = routeFields.endLocation !== undefined && JSON.stringify(routeFields.endLocation) !== JSON.stringify(existing.endLocation);
  const timeChanged = routeFields.departureTime !== undefined;
  const wpsChanged = routeFields.waypoints !== undefined && JSON.stringify(routeFields.waypoints) !== JSON.stringify(
    Array.isArray((existing as any).waypoints) ? (existing as any).waypoints : (existing as any).waypoints?.requested || []
  );
  const optimizeChanged = routeFields.optimizeWaypoints !== undefined && optimizeWaypoints !== ((existing as any).waypoints?.optimize ?? false);

  if (startChanged || endChanged || timeChanged || wpsChanged || optimizeChanged) {
    const origin = payload.startLocation ?? existing.startLocation;
    const destination = payload.endLocation ?? existing.endLocation;
    const depTime = (payload.departureTime ?? existing.departureTime).toISOString();
    const currentWps = routeFields.waypoints !== undefined ? (routeFields.waypoints || []) : (Array.isArray((existing as any).waypoints) ? (existing as any).waypoints : (existing as any).waypoints?.requested || []);
    const currentOptimize = optimizeWaypoints !== undefined ? optimizeWaypoints : ((existing as any).waypoints?.optimize ?? false);

    const directions = await getDirections({ origin, destination, waypoints: currentWps, optimizeWaypoints: currentOptimize, alternatives: false, departureTime: depTime });
    enrichPayloadFromDirections(payload, directions, currentWps, currentOptimize);
  }

  const updated = await routeService.updateRoute(id, payload as any);
  res.status(200).json({ success: true, message: 'Route (by admin) updated successfully', data: updated });
});

export const adminDeleteRoute = asyncHandler(async (req: Request, res: Response) => {
  const existing = await routeService.getRouteById(req.params.id);
  if (!existing) throw new ApiError(404, 'Route not found');
  const result = await routeService.deleteRoute(req.params.id);
  res.status(200).json({ success: true, message: 'Route (by admin) deleted successfully', data: result });
});

export const cancelRoute = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await routeService.cancelRoute(req.params.id, authReq.user!.sub, { reason: req.body.reason });
  res.status(200).json({ success: true, message: 'Route cancelled successfully', data: result });
});
