import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // === GPUs ===
  {
    name: 'NVIDIA GeForce RTX 4090',
    description: 'The ultimate gaming GPU with Ada Lovelace architecture. Dominates 4K gaming and AI workloads.',
    category: 'GPU',
    price: 159999,
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
    brand: 'NVIDIA',
    stock: 15,
    specs: {
      VRAM: '24GB GDDR6X',
      'Core Clock': '2.23 GHz',
      'Boost Clock': '2.52 GHz',
      'TDP': '450W',
      'Bus Width': '384-bit',
      'CUDA Cores': '16384',
      Connector: 'PCIe 4.0 x16',
      Outputs: 'HDMI 2.1, 3x DisplayPort 1.4a'
    }
  },
  {
    name: 'NVIDIA GeForce RTX 4080 Super',
    description: 'Elite 4K gaming performance with DLSS 3.5 and Frame Generation. Outstanding ray tracing.',
    category: 'GPU',
    price: 99999,
    imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    brand: 'NVIDIA',
    stock: 22,
    specs: {
      VRAM: '16GB GDDR6X',
      'Core Clock': '2.21 GHz',
      'Boost Clock': '2.55 GHz',
      'TDP': '320W',
      'Bus Width': '256-bit',
      'CUDA Cores': '10240',
      Connector: 'PCIe 4.0 x16',
      Outputs: 'HDMI 2.1, 3x DisplayPort 1.4a'
    }
  },
  {
    name: 'AMD Radeon RX 7900 XTX',
    description: 'AMD flagship GPU with RDNA 3 architecture. Exceptional 4K performance at competitive pricing.',
    category: 'GPU',
    price: 84999,
    imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800',
    brand: 'AMD',
    stock: 18,
    specs: {
      VRAM: '24GB GDDR6',
      'Core Clock': '1.9 GHz',
      'Boost Clock': '2.5 GHz',
      'TDP': '355W',
      'Bus Width': '384-bit',
      'Stream Processors': '12288',
      Connector: 'PCIe 4.0 x16',
      Outputs: 'HDMI 2.1, 2x DisplayPort 2.1, USB-C'
    }
  },
  {
    name: 'NVIDIA GeForce RTX 4070 Ti Super',
    description: 'Perfect 1440p to 4K sweet spot. DLSS 3.5 support for incredible performance per watt.',
    category: 'GPU',
    price: 74999,
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
    brand: 'NVIDIA',
    stock: 30,
    specs: {
      VRAM: '16GB GDDR6X',
      'Core Clock': '2.34 GHz',
      'Boost Clock': '2.61 GHz',
      'TDP': '285W',
      'Bus Width': '256-bit',
      'CUDA Cores': '8448',
      Connector: 'PCIe 4.0 x16',
      Outputs: 'HDMI 2.1, 3x DisplayPort 1.4a'
    }
  },

  // === CPUs ===
  {
    name: 'Intel Core i9-14900K',
    description: 'Intel\'s flagship desktop CPU with 24 cores (8P + 16E). Unleashed performance for gaming and content creation.',
    category: 'CPU',
    price: 47999,
    imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3772e4783?w=800',
    brand: 'Intel',
    stock: 25,
    specs: {
      Cores: '24 (8P + 16E)',
      Threads: '32',
      'Base Clock': '3.2 GHz (P-core)',
      'Boost Clock': '6.0 GHz',
      'Cache': '36MB L3',
      'TDP': '125W (253W PL2)',
      Socket: 'LGA1700',
      'Memory Support': 'DDR4/DDR5'
    }
  },
  {
    name: 'AMD Ryzen 9 7950X',
    description: 'AMD\'s 16-core Zen 4 powerhouse. Unmatched multi-threaded performance for professional workloads.',
    category: 'CPU',
    price: 52999,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    brand: 'AMD',
    stock: 20,
    specs: {
      Cores: '16',
      Threads: '32',
      'Base Clock': '4.5 GHz',
      'Boost Clock': '5.7 GHz',
      'Cache': '64MB L3',
      'TDP': '170W',
      Socket: 'AM5',
      'Memory Support': 'DDR5'
    }
  },
  {
    name: 'AMD Ryzen 7 7800X3D',
    description: 'The ultimate gaming CPU with 3D V-Cache technology. Destroys the competition in gaming benchmarks.',
    category: 'CPU',
    price: 35999,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    brand: 'AMD',
    stock: 35,
    specs: {
      Cores: '8',
      Threads: '16',
      'Base Clock': '4.2 GHz',
      'Boost Clock': '5.0 GHz',
      'Cache': '96MB L3 (with 3D V-Cache)',
      'TDP': '120W',
      Socket: 'AM5',
      'Memory Support': 'DDR5'
    }
  },
  {
    name: 'Intel Core i5-14600K',
    description: 'Best mid-range gaming CPU. Exceptional value with 14 cores and high clock speeds.',
    category: 'CPU',
    price: 24999,
    imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3772e4783?w=800',
    brand: 'Intel',
    stock: 45,
    specs: {
      Cores: '14 (6P + 8E)',
      Threads: '20',
      'Base Clock': '3.5 GHz (P-core)',
      'Boost Clock': '5.3 GHz',
      'Cache': '24MB L3',
      'TDP': '125W',
      Socket: 'LGA1700',
      'Memory Support': 'DDR4/DDR5'
    }
  },

  // === RAM ===
  {
    name: 'G.Skill Trident Z5 RGB 32GB DDR5',
    description: 'Blazing-fast DDR5 RAM with RGB lighting. Dual channel 32GB kit for top-tier gaming.',
    category: 'RAM',
    price: 12999,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800',
    brand: 'G.Skill',
    stock: 50,
    specs: {
      Capacity: '32GB (2x16GB)',
      Type: 'DDR5',
      Speed: '6000 MHz',
      Latency: 'CL36',
      Voltage: '1.35V',
      Profile: 'XMP 3.0 / EXPO',
      RGB: 'Yes',
      Form: 'DIMM'
    }
  },
  {
    name: 'Corsair Vengeance 64GB DDR5',
    description: 'High-capacity 64GB DDR5 kit. Ideal for content creators, streamers, and heavy multitasking.',
    category: 'RAM',
    price: 22999,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800',
    brand: 'Corsair',
    stock: 30,
    specs: {
      Capacity: '64GB (2x32GB)',
      Type: 'DDR5',
      Speed: '5600 MHz',
      Latency: 'CL40',
      Voltage: '1.25V',
      Profile: 'XMP 3.0',
      RGB: 'No',
      Form: 'DIMM'
    }
  },
  {
    name: 'Kingston Fury Beast 16GB DDR4',
    description: 'Reliable DDR4 kit for budget to mid-range builds. Great performance at accessible pricing.',
    category: 'RAM',
    price: 4999,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800',
    brand: 'Kingston',
    stock: 80,
    specs: {
      Capacity: '16GB (2x8GB)',
      Type: 'DDR4',
      Speed: '3200 MHz',
      Latency: 'CL16',
      Voltage: '1.35V',
      Profile: 'XMP 2.0',
      RGB: 'No',
      Form: 'DIMM'
    }
  },
  {
    name: 'Team T-Force Delta RGB 128GB DDR5',
    description: 'Extreme 128GB DDR5 quad-channel kit with stunning RGB. For workstation-class builds.',
    category: 'RAM',
    price: 44999,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145851?w=800',
    brand: 'Team Group',
    stock: 12,
    specs: {
      Capacity: '128GB (4x32GB)',
      Type: 'DDR5',
      Speed: '6400 MHz',
      Latency: 'CL32',
      Voltage: '1.4V',
      Profile: 'XMP 3.0 / EXPO',
      RGB: 'Yes',
      Form: 'DIMM'
    }
  },

  // === Cooling Fans ===
  {
    name: 'Noctua NH-D15 CPU Cooler',
    description: 'The legendary Noctua dual-tower air cooler. Near-silent operation with exceptional thermal performance.',
    category: 'COOLING_FAN',
    price: 8999,
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
    brand: 'Noctua',
    stock: 40,
    specs: {
      Type: 'Air Cooler (Dual Tower)',
      Fans: '2x 140mm NF-A15 PWM',
      'Fan Speed': '300-1500 RPM',
      'Noise Level': '19.2 dBA (max)',
      'TDP Rating': '250W+',
      'Socket Support': 'Intel LGA1700/1200/115x, AMD AM5/AM4',
      Height: '165mm',
      Weight: '1320g'
    }
  },
  {
    name: 'Corsair iCUE H150i Elite 360mm AIO',
    description: '360mm liquid AIO cooler with three 120mm RGB fans. Whisper-quiet and high-performance.',
    category: 'COOLING_FAN',
    price: 16999,
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
    brand: 'Corsair',
    stock: 25,
    specs: {
      Type: 'AIO Liquid Cooler',
      Radiator: '360mm',
      Fans: '3x 120mm QL RGB',
      'Fan Speed': '400-2400 RPM',
      'Pump Speed': '2400 RPM',
      'TDP Rating': '350W+',
      'Socket Support': 'Intel LGA1700/1200/115x, AMD AM5/AM4',
      RGB: 'Yes (iCUE)'
    }
  },
  {
    name: 'be quiet! Dark Rock Pro 4',
    description: 'Premium dual-tower air cooler with brushed aluminum finish. Extreme silence for demanding CPUs.',
    category: 'COOLING_FAN',
    price: 7499,
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
    brand: 'be quiet!',
    stock: 35,
    specs: {
      Type: 'Air Cooler (Dual Tower)',
      Fans: '1x 135mm + 1x 120mm Silent Wings 3 PWM',
      'Fan Speed': '1200-1500 RPM',
      'Noise Level': '24.3 dBA (max)',
      'TDP Rating': '250W',
      'Socket Support': 'Intel LGA1700/1200/115x, AMD AM5/AM4',
      Height: '163mm',
      Weight: '1390g'
    }
  },
  {
    name: 'ARCTIC Liquid Freezer III 240 ARGB',
    description: 'Best value 240mm AIO. Exceptional thermal performance with minimal noise and ARGB lighting.',
    category: 'COOLING_FAN',
    price: 8499,
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800',
    brand: 'ARCTIC',
    stock: 48,
    specs: {
      Type: 'AIO Liquid Cooler',
      Radiator: '240mm',
      Fans: '2x 120mm P12 ARGB PWM',
      'Fan Speed': '200-1700 RPM',
      'Pump Speed': '800-2800 RPM',
      'TDP Rating': '300W+',
      'Socket Support': 'Intel LGA1700/1200/115x, AMD AM5/AM4',
      RGB: 'Yes (ARGB)'
    }
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing products
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  for (const product of products) {
    await prisma.product.create({ data: product });
    console.log(`✅ Created: ${product.name}`);
  }

  console.log(`🎉 Seeded ${products.length} products successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
