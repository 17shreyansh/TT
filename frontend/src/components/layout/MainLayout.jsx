import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, AppBar, Toolbar } from '@mui/material';
import { Activity, Layers, List as ListIcon, Settings, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Activity size={20} />, path: '/' },
  { text: 'Sector Strength', icon: <Layers size={20} />, path: '/sectors' },
  { text: 'Active Signals', icon: <Target size={20} />, path: '/signals' },
  { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },
];

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const engineStatus = useStore(state => state.engineStatus);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, boxShadow: 'none' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px !important' }}>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary', fontSize: '1.1rem' }}>
            Realtime Stock Scanner
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: engineStatus === 'RUNNING' ? 'secondary.main' : 'error.main',
              boxShadow: engineStatus === 'RUNNING' ? '0 0 8px #00e676' : '0 0 8px #ff1744'
            }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {engineStatus}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Target color="#2962ff" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: 0.5 }}>
            Scanner
          </Typography>
        </Box>
        <List sx={{ mt: 1, px: 1 }}>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                bgcolor: location.pathname === item.path ? 'rgba(41, 98, 255, 0.15)' : 'transparent',
                mb: 0.5,
                py: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                {React.cloneElement(item.icon, { size: 18 })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  color: location.pathname === item.path ? 'text.primary' : 'text.secondary',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.9rem'
                }} 
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, pt: 10 }}
      >
        {children}
      </Box>
    </Box>
  );
}
