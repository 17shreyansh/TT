import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({ title, value, subtitle, icon, valueColor = 'text.primary' }) {
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
            {title}
          </Typography>
          <Box sx={{ color: 'text.secondary', opacity: 0.7, '& > svg': { width: 18, height: 18 } }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ mb: 0.5, color: valueColor, letterSpacing: -0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
