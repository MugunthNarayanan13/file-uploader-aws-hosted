module.exports = function generateFileMeta(file_id, file, s3_key, path) {
  return {
    file_id,
    file_name: file.originalname,
    s3_key,
    path: path || "/",
    file_size: file.size,
    file_type: file.mimetype,
    created_at: new Date().toISOString(),
    is_folder: false,
  };
};
