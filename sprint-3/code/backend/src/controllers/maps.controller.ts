import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import ApiError from '../utils/ApiError';
import { getDirections, geocode, reverseGeocode } from '../utils/googleMaps';

export const directions = asyncHandler(async (req: Request, res: Response) => {
  const { origin, destination, waypoints, alternatives, departureTime } = req.body;
  if (!origin || !destination) throw new ApiError(400, 'origin & destination are required');

  const data = await getDirections({
    origin,
    destination,
    waypoints: waypoints || [],
    alternatives: alternatives !== false,
    departureTime,
  });

  res.status(200).json({ success: true, data });
});

export const geocodeCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address) throw new ApiError(400, 'address is required');

  const data = await geocode(address as string);
  res.status(200).json({ success: true, data });
});

export const reverseGeocodeCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  if (lat == null || lng == null) throw new ApiError(400, 'lat & lng are required');

  const data = await reverseGeocode(Number(lat), Number(lng));
  res.status(200).json({ success: true, data });
});
