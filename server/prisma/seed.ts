// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // Admin mặc định
  const hashedPassword = await bcrypt.hash('tienPhat@2025', 12);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Quản trị viên',
    },
  });
  console.log('✅ Đã tạo admin mặc định (username: admin / password: tienPhat@2025)');

  // Cấu hình website
  const configs = [
    { key: 'site_name', value: 'Tiến Phát - Vật Liệu Xây Dựng & Nội Thất', description: 'Tên website' },
    { key: 'site_phone', value: '0909 123 456', description: 'Số điện thoại liên hệ' },
    { key: 'site_email', value: 'info@tienphat.com.vn', description: 'Email liên hệ' },
    { key: 'site_address', value: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', description: 'Địa chỉ' },
    { key: 'site_zalo', value: '0909123456', description: 'Số Zalo' },
    { key: 'site_facebook', value: 'https://facebook.com/tienphat', description: 'Facebook' },
    { key: 'site_working_hours', value: 'Thứ 2 - Thứ 7: 7:30 - 17:30', description: 'Giờ làm việc' },
    { key: 'site_map_url', value: 'https://maps.google.com', description: 'Google Maps embed URL' },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('✅ Đã tạo cấu hình website');

  // Danh mục sản phẩm
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'gach-op-lat' },
      update: {},
      create: {
        name: 'Gạch Ốp Lát',
        slug: 'gach-op-lat',
        description: 'Gạch ceramic, porcelain cao cấp nhập khẩu và nội địa',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'son-nuoc' },
      update: {},
      create: {
        name: 'Sơn Nước',
        slug: 'son-nuoc',
        description: 'Sơn nội thất, ngoại thất các thương hiệu hàng đầu',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'vat-lieu-chong-tham' },
      update: {},
      create: {
        name: 'Vật Liệu Chống Thấm',
        slug: 'vat-lieu-chong-tham',
        description: 'Hệ vật liệu chống thấm sàn, mái, tường',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'thiet-bi-ve-sinh' },
      update: {},
      create: {
        name: 'Thiết Bị Vệ Sinh',
        slug: 'thiet-bi-ve-sinh',
        description: 'Lavabo, bồn cầu, vòi sen cao cấp',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'noi-that-go' },
      update: {},
      create: {
        name: 'Nội Thất Gỗ',
        slug: 'noi-that-go',
        description: 'Sàn gỗ tự nhiên, gỗ công nghiệp, cửa gỗ',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'xi-mang-vua-tron' },
      update: {},
      create: {
        name: 'Xi Măng & Vữa Trộn',
        slug: 'xi-mang-vua-tron',
        description: 'Xi măng, vữa xây, vữa lát nền các loại',
        sortOrder: 6,
      },
    }),
  ]);
  console.log('✅ Đã tạo', categories.length, 'danh mục');

  // Banner mẫu
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Vật Liệu Xây Dựng Chất Lượng Cao', subtitle: 'Cam kết chính hãng - Giá tốt nhất thị trường', imageUrl: '/images/banner-1.jpg', isActive: true, sortOrder: 1 },
      { title: 'Trang Trí Nội Thất Đẳng Cấp', subtitle: 'Hàng ngàn mẫu mã đa dạng cho mọi không gian', imageUrl: '/images/banner-2.jpg', isActive: true, sortOrder: 2 },
      { title: 'Giao Hàng Toàn TP.HCM', subtitle: 'Nhanh chóng - Đúng hẹn - Trọn gói', imageUrl: '/images/banner-3.jpg', isActive: true, sortOrder: 3 },
    ],
  });
  console.log('✅ Đã tạo banner mẫu');

  console.log('🎉 Seed hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
