import React, { useState } from "react";
import { Box, Typography, TextField, Button, FormControl, Select, MenuItem, Grid, InputLabel, OutlinedInput, InputAdornment } from "@mui/material";
import { Stack } from "@mui/system";
import { IoReloadOutline } from "react-icons/io5";
import { Add, Search } from "@mui/icons-material";

import StartupCard from "./components/StartupCard";
import AddStartupModal from "./components/AddStartupModal";

function Discover() {
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleIndustryChange = (event) => {
    setSelectedIndustry(event.target.value);
  };

  const handleStageChange = (event) => {
    setSelectedStage(event.target.value);
  };

  const handleLocationChange = (event) => {
    setLocationQuery(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Dummy data for startup cards
  const dummyStartups = [
    {
      id: 1,
      name: "Test DB",
      stage: "Idea",
      description: "Test DB",
      industry: "Technology",
      location: "Test DB",
      roles: 0,
      tasks: 0,
      views: 5,
      createdDate: "18/5/2025",
      foundedBy: "trial@sfm.com",
      availableRoles: [
        {
          id: 101,
          title: 'Admin',
          type: 'Volunteer',
          postedDate: '5/18/2025',
        },
        {
          id: 102,
          title: 'Developer',
          type: 'Paid',
          postedDate: '5/19/2025',
        },
      ]
    },
    {
      id: 2,
      name: "Manual Test Startup",
      stage: "Idea",
      description: "Testing full creation",
      industry: "Healthcare",
      location: "New York",
      roles: 0,
      tasks: 0,
      views: 0,
      createdDate: "18/5/2025",
      foundedBy: "trial@sfm.com",
      availableRoles: [
        {
          id: 101,
          title: 'Admin',
          type: 'Volunteer',
          postedDate: '5/18/2025',
        },
        {
          id: 102,
          title: 'Developer',
          type: 'Paid',
          postedDate: '5/19/2025',
        },
      ]
    },
    {
      id: 3,
      name: "Another Startup",
      stage: "Seed",
      description: "Focusing on AI",
      industry: "Technology",
      location: "San Francisco",
      roles: 2,
      tasks: 5,
      views: 10,
      createdDate: "20/5/2025",
      foundedBy: "founder@example.com",
      availableRoles: [
        {
          id: 301,
          title: 'AI Engineer',
          type: 'Paid',
          postedDate: '5/21/2025',
        },
        {
          id: 302,
          title: 'Data Scientist',
          type: 'Paid',
          postedDate: '5/22/2025',
        },
      ]
    },
    {
      id: 4,
      name: "Beta Startup",
      stage: "Growth",
      description: "Expanding rapidly",
      industry: "Finance",
      location: "London",
      roles: 5,
      tasks: 15,
      views: 25,
      createdDate: "22/5/2025",
      foundedBy: "info@betastartup.com",
      availableRoles: [
        {
          id: 401,
          title: 'Financial Analyst',
          type: 'Paid',
          postedDate: '5/23/2025',
        },
        {
          id: 402,
          title: 'Marketing Specialist',
          type: 'Paid',
          postedDate: '5/24/2025',
        },
      ]
    },
  ];

  // Filtering logic
  const filteredStartups = dummyStartups.filter(startup => {
    const matchesSearchQuery = searchQuery === '' ||
                               startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               startup.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               startup.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = selectedIndustry === '' || startup.industry === selectedIndustry;
    const matchesStage = selectedStage === '' || startup.stage === selectedStage;
    const matchesLocation = locationQuery === '' || startup.location.toLowerCase().includes(locationQuery.toLowerCase());

    return matchesSearchQuery && matchesIndustry && matchesStage && matchesLocation;
  });

  return (
    <Box
      sx={{
        padding: 4,
        ml: { sm: '250px' }, // Add left margin for sidebar on medium and larger screens
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Join a Startup
        </Typography>
        <Typography variant="body1">
          Discover startups with open roles that match your skills and interests.
        </Typography>
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          label="Search by name, industry, location"
          variant="outlined"
          size="small"
          placeholder="Try: tech, San Francisco, developer, seed"
          sx={{
            minWidth: 300,
            flexGrow: 1,
            borderRadius: '20px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              paddingLeft: '10px',
            },
          }}
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" startIcon={<IoReloadOutline />} sx={{ borderRadius: '20px', height: '40px' }}>
          Refresh
        </Button>
        <FormControl size="small" sx={{ minWidth: 120, height: '40px' }}>
          <Select
            value={selectedIndustry}
            onChange={handleIndustryChange}
            displayEmpty
            input={
              <OutlinedInput
                sx={{
                  borderRadius: '20px',
                  padding: '8px 12px',
                  height: '40px',
                }}
              />
            }
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <Typography variant="body2" color="text.secondary">Select industry</Typography>;
              }
              return selected;
            }}
          >
            <MenuItem value="">All Industries</MenuItem>
            <MenuItem value="Technology">Technology</MenuItem>
            <MenuItem value="Healthcare">Healthcare</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120, height: '40px' }}>
          <Select
            value={selectedStage}
            onChange={handleStageChange}
            displayEmpty
            input={
              <OutlinedInput
                sx={{
                  borderRadius: '20px',
                  padding: '8px 12px',
                  height: '40px',
                }}
              />
            }
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <Typography variant="body2" color="text.secondary">All Stages</Typography>;
              }
              return selected;
            }}
          >
            <MenuItem value="">All Stages</MenuItem>
            <MenuItem value="Idea">Idea</MenuItem>
            <MenuItem value="Seed">Seed</MenuItem>
            <MenuItem value="Growth">Growth</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Location (City, Country)"
          variant="outlined"
          size="small"
          placeholder="Location (City, Country)"
          sx={{
            minWidth: 200,
            borderRadius: '20px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              height: '40px',
            },
          }}
          value={locationQuery}
          onChange={handleLocationChange}
        />
        <Button variant="contained" startIcon={<Add />} sx={{ borderRadius: '20px', height: '40px' }} onClick={handleOpenModal}>
          Create Startup
        </Button>
      </Stack>
      <Box>
        <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'white' }}>
          Startup List
        </Typography>
        <Grid container spacing={2}>
          {filteredStartups.map((startup, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <StartupCard startup={startup} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <AddStartupModal open={isModalOpen} handleClose={handleCloseModal} />
    </Box>
  );
}

export default Discover; 