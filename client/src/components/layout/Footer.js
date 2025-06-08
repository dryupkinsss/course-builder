import React from 'react';
import { Box, Typography, Grid, IconButton, Divider, Link } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MailIcon from '@mui/icons-material/Mail';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookIcon from '@mui/icons-material/MenuBook';

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#18181b', color: '#fff', mt: 8, pt: 8, pb: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #1976d2 60%, #7c3aed 100%)',
                borderRadius: 2,
                p: 1,
                mr: 1
              }}>
                <BookIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Course Builder</Typography>
            </Box>
            <Typography variant="body2" color="#a3a3a3" sx={{ mb: 2 }}>
              Ведущая платформа онлайн-образования с лучшими преподавателями.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton href="#" sx={{ color: '#a3a3a3', ':hover': { color: '#1976d2' } }}><FacebookIcon /></IconButton>
              <IconButton href="#" sx={{ color: '#a3a3a3', ':hover': { color: '#1976d2' } }}><TwitterIcon /></IconButton>
              <IconButton href="#" sx={{ color: '#a3a3a3', ':hover': { color: '#1976d2' } }}><InstagramIcon /></IconButton>
              <IconButton href="#" sx={{ color: '#a3a3a3', ':hover': { color: '#1976d2' } }}><YouTubeIcon /></IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={4} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Быстрые ссылки</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/about" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>О нас</Link>
              <Link href="/courses" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Каталог курсов</Link>
              <Link href="/register?role=teacher" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Стать преподавателем</Link>
            </Box>
          </Grid>

          {/* Categories */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Категории</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Программирование</Link>
              <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Дизайн</Link>
              <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Маркетинг</Link>
              <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Бизнес</Link>
              <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' } }}>Языки</Link>
            </Box>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Контакты</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#a3a3a3' }}>
                <MailIcon sx={{ fontSize: 18, mr: 1 }} /> info@coursebuilder.ru
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#a3a3a3' }}>
                <PhoneIcon sx={{ fontSize: 18, mr: 1 }} /> +7 (495) 123-45-67
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#a3a3a3' }}>
                <LocationOnIcon sx={{ fontSize: 18, mr: 1 }} /> Москва, ул. Тестовая, 123
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: '#23232a', my: 6 }} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography color="#a3a3a3" variant="body2">
            © 2024 Course Builder. Все права защищены.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' }, fontSize: 14 }}>Политика конфиденциальности</Link>
            <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' }, fontSize: 14 }}>Условия использования</Link>
            <Link href="#" color="#a3a3a3" underline="hover" sx={{ ':hover': { color: '#fff' }, fontSize: 14 }}>Поддержка</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer; 