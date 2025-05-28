import React from "react";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { MdOutlineWorkOutline, MdOutlineLocationOn, MdOutlinePersonOutline, MdOutlineVisibility } from "react-icons/md";
import { useHistory } from 'react-router-dom';

function StartupCard({ startup  }) {
  const history = useHistory();

  const handleViewRolesClick = () => {
    history.push(`/startup-profile/${startup.id}`);
  };

  return (
    <Card sx={{
      bgcolor: '#1a2035',
      borderRadius: '12px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: 'white !important',
    }}>
      <CardContent sx={{ 
        padding: '16px', 
        '&:last-child': { paddingBottom: '16px' },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        color: 'white !important',
        '& .MuiTypography-root': {
          color: 'white !important',
        },
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ color: 'white !important' }}>
            {startup.name}
          </Typography>
          <Typography variant="caption" sx={{
            bgcolor: 'purple',
            color: 'white !important',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {startup.stage}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: 'white !important' }}>
          {startup.description}
        </Typography>
        <Stack spacing={1} sx={{ mb: 2, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MdOutlineWorkOutline style={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white !important' }}>{startup.industry}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MdOutlineLocationOn style={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white !important' }}>{startup.location}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MdOutlinePersonOutline style={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white !important' }}>{startup.roles.length > 0 ? startup.roles.map(role => role.title).join(', ') : 'No roles available'}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MdOutlineWorkOutline style={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white !important' }}>{startup.tasks} Tasks</Typography>
            <MdOutlineVisibility style={{ marginLeft: '8px', color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white !important' }}>{startup.views}</Typography>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ color: 'white !important', mb: 2 }}>
          Created: {startup.createdDate}
        </Typography>
        <Button 
          variant="contained" 
          fullWidth 
          sx={{ 
            mt: 'auto',
            borderRadius: '30px',
            bgcolor: '#4318FF',
            color: 'white !important',
            '&:hover': {
              bgcolor: '#3311CC',
              color: 'white !important',
            }
          }}
          onClick={handleViewRolesClick}
        >
          View Roles1221
        </Button>
      </CardContent>
    </Card>
  );
}

export default StartupCard; 