import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Input,
  Stack,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from "@mui/icons-material/Close";
import { uploadDocument, getDocuments, downloadDocument, updateDocument } from '../../../../api/document'; // Import the updateDocument function

const Documents = ({ startupId }) => {
  const [documents, setDocuments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false); // State for edit dialog
  const [newDocument, setNewDocument] = useState({
    name: '',
    description: '',
    file: null,
    startupId: startupId,
  });
  const [currentDocumentId, setCurrentDocumentId] = useState(null); // State to hold the current document ID for editing

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await getDocuments(); // Call the getDocuments API
        setDocuments(docs); // Set the documents state
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments(); // Fetch documents on component mount
  }, [startupId]); // Dependency array to refetch if startupId changes

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setNewDocument({ name: '', description: '', file: null });
  };

  const handleEditDialogOpen = (doc) => {
    setCurrentDocumentId(doc.id);
    setNewDocument({ name: doc.name, description: doc.description, file: null });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setNewDocument({ name: '', description: '', file: null });
    setCurrentDocumentId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument({ ...newDocument, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewDocument({ ...newDocument, file: e.target.files[0] });
  };

  const handleUpload = async () => {
    if (newDocument.name && newDocument.file) {
      try {
        const uploadedDoc = await uploadDocument(newDocument.file, newDocument.name, newDocument.description, startupId);
        const doc = {
          id: uploadedDoc.id, // Assuming the response contains the document ID
          name: uploadedDoc.name,
          description: uploadedDoc.description,
          downloads: 0,
        };
        setDocuments([...documents, doc]);
        handleUploadDialogClose();
      } catch (error) {
        alert("Error uploading document: " + error.message);
      }
    } else {
      // Handle validation: name and file are required
      alert("Please provide document name and select a file.");
    }
  };

  const handleUpdate = async () => {
    if (currentDocumentId && newDocument.name) {
      // Optimistically update UI
      const prevDocuments = [...documents];
      const updatedDoc = {
        id: currentDocumentId,
        name: newDocument.name,
        description: newDocument.description,
      };
  
      setDocuments(documents.map(doc => (
        doc.id === currentDocumentId ? { ...doc, ...updatedDoc } : doc
      )));
      handleEditDialogClose();
  
      try {
        await updateDocument(currentDocumentId, {
          name: newDocument.name,
          description: newDocument.description,
        });
        // Success: no further action needed
      } catch (error) {
        // On error, revert UI changes and notify the user
        alert("Error updating document: " + error.message);
        setDocuments(prevDocuments);
      }
    } else {
      alert("Please provide document name.");
    }
  };
  

  const handleDownload = async (docId) => {
    try {
      const fileData = await downloadDocument(docId); // Call the downloadDocument API
      const blob = new Blob([fileData]); // Create a blob from the response
      const url = window.URL.createObjectURL(blob); // Create a URL for the blob
      const a = document.createElement('a'); // Create an anchor element
      a.href = url; // Set the href to the blob URL
      a.download = `document-${docId}.pdf`; // Set the download attribute with a filename
      document.body.appendChild(a); // Append the anchor to the body
      a.click(); // Programmatically click the anchor to trigger the download
      a.remove(); // Remove the anchor from the document
      window.URL.revokeObjectURL(url); // Release the blob URL
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error downloading document: " + error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="primary">Documents</Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={4}>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleUploadDialogOpen}
          sx={{
            bgcolor: "#4318FF",
            px: 3,
            py: 1,
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)',
            '&:hover': {
              bgcolor: "#3311CC",
              boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)',
            }
          }}
        >
          Upload Document
        </Button>
        {/* Add other filter/sort options here if needed */}
      </Stack>

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <Card sx={{ borderRadius: '12px', bgcolor: 'background.paper', border: '1px solid rgba(112, 144, 176, 0.1)' }} elevation={0}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={1} color="white">
                  {doc.name}
                </Typography>
                <Typography variant="body2" color="white" sx={{ opacity: 0.8, mb: 1 }}>
                  {doc.description || 'No description provided.'}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                    Downloads: {doc.downloads}
                  </Typography>
                  <IconButton 
                    onClick={() => handleDownload(doc.id)} // Call handleDownload with document ID
                    sx={{ color: "#4318FF", '&:hover': { color: '#3311CC' } }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                  <Button onClick={() => handleEditDialogOpen(doc)} sx={{ color: "#4318FF" }}>Edit</Button> {/* Edit button */}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Upload New Document</Typography>
          <IconButton onClick={handleUploadDialogClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Document Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDocument.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
           <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newDocument.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <Input
            type="file"
            fullWidth
            onChange={handleFileChange}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Button onClick={handleUploadDialogClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" sx={{ bgcolor: "#4318FF", px: 3, textTransform: 'none', borderRadius: '12px', boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)', '&:hover': { bgcolor: "#3311CC", boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)' } }}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Document</Typography>
          <IconButton onClick={handleEditDialogClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Document Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDocument.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newDocument.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Button onClick={handleEditDialogClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ bgcolor: "#4318FF", px: 3, textTransform: 'none', borderRadius: '12px', boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)', '&:hover': { bgcolor: "#3311CC", boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)' } }}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents; 