import UploadFolder from "./components/UploadFolder";

function App() {
  return (
    <div style={{ padding: "20px", width: "100vw", margin: "auto", minHeight: "100vh"}}>
      <div>
        <h1 style={{ textAlign: "center" }}>My Drive</h1>
        <p style={{ textAlign: "center" }}>
          Upload your files to My Drive. You can upload folders and files.
        </p>
      </div>
      <UploadFolder />
      <div style={{ marginTop: "30px" }}>
        {/* Folder and files will be displayed here */}
        <h2>Folders & Files</h2>
        {/* Example placeholder content */}
        <ul>
          <li>Folder 1/</li>
          <li>Folder 2/</li>
          <li>file1.txt</li>
          <li>file2.pdf</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
