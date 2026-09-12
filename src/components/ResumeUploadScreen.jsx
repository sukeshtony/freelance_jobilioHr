const ResumeUploadScreen = ({ onUpload }) => {
  return (
    <div className="p-4">
      <h2>Upload Your Resume</h2>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onUpload}
        className="form-control mt-3"
      />
    </div>
  );
};

export default ResumeUploadScreen;