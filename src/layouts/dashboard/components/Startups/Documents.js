import React, { useState } from "react";
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

const Documents = () => {
  const [documents, setDocuments] = useState([
    // Dummy data for initial documents
    { id: 1, name: 'Startup Pitch Deck.pdf', downloads: 15 },
    { id: 2, name: 'Financial Projections.xlsx', downloads: 8 },
    { id: 3, name: 'Team Structure.docx', downloads: 22 },
  ]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    description: '',
    file: null,
  });

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setNewDocument({ name: '', description: '', file: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument({ ...newDocument, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewDocument({ ...newDocument, file: e.target.files[0] });
  };

  const handleUpload = () => {
    if (newDocument.name && newDocument.file) {
      const doc = {
        id: Date.now() + Math.random(), // Simple unique ID
        name: newDocument.name,
        description: newDocument.description,
        downloads: 0,
        // In a real app, you'd upload the file content here
        // fileContent: newDocument.file
      };
      setDocuments([...documents, doc]);
      handleUploadDialogClose();
    } else {
      // Handle validation: name and file are required
      alert("Please provide document name and select a file.");
    }
  };

  const handleDownload = (docId) => {
    setDocuments(documents.map(doc =>
      doc.id === docId ? { ...doc, downloads: doc.downloads + 1 } : doc
    ));
    // In a real app, trigger actual file download here
    console.log(`Simulating download for document ID: ${docId}`);
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
                    onClick={() => handleDownload(doc.id)}
                    sx={{ color: "#4318FF", '&:hover': { color: '#3311CC' } }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Box>
  );
};

export default Documents; 