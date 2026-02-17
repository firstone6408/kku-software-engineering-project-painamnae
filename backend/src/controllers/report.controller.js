const asyncHandler = require("express-async-handler");
const reportService = require("../services/report.service");
const { Role } = require("@prisma/client");
const ApiError = require("../utils/ApiError");
const { uploadToCloudinary } = require("../utils/cloudinary");

/**
 * อัปโหลดไฟล์จาก req.files ไป Cloudinary
 * @returns {Array<{url, publicId, type}>}
 */
async function uploadReportMedia(files) {
  if (!files || files.length === 0) return [];

  const results = await Promise.all(
    files.map((file) =>
      uploadToCloudinary(file.buffer, "painamnae/reports")
    )
  );

  return results.map((r, i) => ({
    url: r.url,
    publicId: r.public_id,
    type: files[i].mimetype.startsWith("video/") ? "VIDEO" : "IMAGE",
  }));
}

const createDriverReport = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const userRole = req.user.role;

  if (userRole !== Role.DRIVER) {
    throw new ApiError(403, "Forbidden");
  }

  const mediaItems = await uploadReportMedia(req.files);

  const createdReport = await reportService.createDriverReport(
    userId,
    req.body,
    mediaItems
  );
  res.status(201).json({
    success: true,
    message: "Report created successfully",
    data: createdReport,
  });
});

const createPassengerReport = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const userRole = req.user.role;

  if (userRole !== Role.PASSENGER) {
    throw new ApiError(403, "Forbidden");
  }

  const mediaItems = await uploadReportMedia(req.files);

  const createdReport = await reportService.createPassengerReport(
    userId,
    req.body,
    mediaItems
  );
  res.status(201).json({
    success: true,
    message: "Report created successfully",
    data: createdReport,
  });
});

const updateReport = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.sub;

  const mediaItems = await uploadReportMedia(req.files);

  const updatedReport = await reportService.updateReport(
    reportId,
    userId,
    req.body,
    mediaItems
  );
  res.status(200).json({
    success: true,
    message: "Report updated successfully",
    data: updatedReport,
  });
});

const getReportByUserId = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const reports = await reportService.getReportsByUserId(userId);
  res.status(200).json({
    success: true,
    message: "Reports retrieved successfully",
    data: reports,
  });
});

const resolveReport = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const resolved = await reportService.resolveReport(reportId);
  res.status(200).json({
    success: true,
    message: "Report resolved successfully",
    data: resolved,
  });
});

module.exports = {
  createDriverReport,
  createPassengerReport,
  updateReport,
  getReportByUserId,
  resolveReport,
};
