import { ServiceItem, SpecialPackage } from '../types/catalog';

export const WHATSAPP_PHONE = '584242934550';
export const WHATSAPP_DISPLAY = '+58 424 2934550';
export const BINANCE_PAY_ID = '965190483';

export const PAGO_MOVIL_DATA = {
  bank: 'Banco de Venezuela',
  bankCode: '0102',
  phone: '04242934550',
  id: '28525460',
};

export const NETWORK_INFO = {
  instagram: {
    name: 'Instagram',
    color: 'from-fuchsia-600 via-pink-600 to-rose-500',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    borderHover: 'hover:border-pink-500/50',
    tag: 'IG Viral',
    iconColor: '#E1306C',
  },
  tiktok: {
    name: 'TikTok',
    color: 'from-cyan-500 via-zinc-900 to-rose-500',
    badgeColor: 'bg-zinc-900 text-cyan-400 border border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/50',
    tag: 'TikTok Trends',
    iconColor: '#00F2FE',
  },
  youtube: {
    name: 'YouTube',
    color: 'from-red-600 to-red-700',
    badgeColor: 'bg-red-600 text-white',
    borderHover: 'hover:border-red-500/50',
    tag: 'YouTube Studio',
    iconColor: '#FF0000',
  },
  facebook: {
    name: 'Facebook',
    color: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-600 text-white',
    borderHover: 'hover:border-blue-500/50',
    tag: 'Meta Growth',
    iconColor: '#1877F2',
  },
  kick: {
    name: 'Kick',
    color: 'from-emerald-500 to-green-600',
    badgeColor: 'bg-emerald-500 text-black font-bold',
    borderHover: 'hover:border-emerald-500/50',
    tag: 'Kick Streaming',
    iconColor: '#53FC18',
  },
  spotify: {
    name: 'Spotify',
    color: 'from-emerald-600 via-green-600 to-emerald-500',
    badgeColor: 'bg-emerald-600 text-white font-bold',
    borderHover: 'hover:border-green-500/50',
    tag: 'Spotify for Artists',
    iconColor: '#1DB954',
  },
  special: {
    name: 'Ofertas Especiales',
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    borderHover: 'hover:border-amber-500/50',
    tag: 'Solo por Hoy',
    iconColor: '#F59E0B',
  },
};

// Representative high quality curated images for services
export const SERVICES_DATA: ServiceItem[] = [
  // --- FACEBOOK ---
  {
    id: 'fb-seg',
    network: 'facebook',
    name: 'Seguidores de Página / Perfil',
    metric: '1K Seg.',
    price: 15,
    unit: '1,000 seguidores',
    description: 'Seguidores de alta retención para fanpages o perfiles de Facebook. Impulsa la autoridad de tu marca.',
    popular: true,
    tag: 'Más pedido',
    image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-lives',
    network: 'facebook',
    name: 'Espectadores en Vivo (Lives)',
    metric: '1K Lives',
    price: 30,
    unit: '1,000 viewers en directo',
    description: 'Audiencia masiva en tus transmisiones en vivo para posicionar tu directo en recomendaciones.',
    image: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-likes',
    network: 'facebook',
    name: 'Likes en Publicaciones',
    metric: '1K Likes',
    price: 10,
    unit: '1,000 reacciones',
    description: 'Me Gustas inmediatos para fotos, álbumes, estados o enlaces.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-reels',
    network: 'facebook',
    name: 'Interacción en Facebook Reels',
    metric: '1K Reels',
    price: 15,
    unit: '1,000 interacciones de reel',
    description: 'Posicionamiento y reproducciones aceleradas para tus videos cortos en Facebook Reels.',
    popular: true,
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-emojis',
    network: 'facebook',
    name: 'Reacciones Personalizadas (Emojis)',
    metric: '1K Emojis',
    price: 15,
    unit: '1,000 emojis (Me encanta/Me importa)',
    description: 'Reacciones auténticas (Love, Wow, Care) que mejoran el engagement orgánico.',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-vistas',
    network: 'facebook',
    name: 'Reproducciones de Video',
    metric: '1K Vistas',
    price: 10,
    unit: '1,000 vistas de video',
    description: 'Aumenta el tiempo de visualización de tus videos largos o promocionales.',
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-share',
    network: 'facebook',
    name: 'Compartidos en Grupos y Muros',
    metric: '1K Share',
    price: 10,
    unit: '1,000 compartidos',
    description: 'Hace que tu publicación sea compartida miles de veces, multiplicando el alcance viral.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fb-votos',
    network: 'facebook',
    name: 'Votos en Concursos y Encuestas',
    metric: '1K Votos',
    price: 50,
    unit: '1,000 votos garantizados',
    description: 'Votos verificados para encuestas, sorteos oficiales o concursos en páginas.',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
  },

  // --- TIKTOK ---
  {
    id: 'tt-seg',
    network: 'tiktok',
    name: 'Seguidores Reales TikTok',
    metric: '1K Seg.',
    price: 15,
    unit: '1,000 seguidores',
    description: 'Desbloquea los requisitos para directos, enlaces en bio y fondo de creadores.',
    popular: true,
    tag: 'Habilita Lives',
    image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-lives',
    network: 'tiktok',
    name: 'Espectadores en TikTok Live',
    metric: '1K Lives',
    price: 20,
    unit: '1,000 espectadores de Live',
    description: 'Impulsa tus batallas y transmisiones con audiencia continua y alta retención.',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-likes',
    network: 'tiktok',
    name: 'Likes en Videos TikTok',
    metric: '1K Likes',
    price: 10,
    unit: '1,000 likes',
    description: 'La métrica clave que activa el algoritmo "Para Ti" (FYP).',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-views',
    network: 'tiktok',
    name: 'Reproducciones Virales TikTok',
    metric: '3K Views',
    price: 10,
    unit: '3,000 reproducciones',
    description: '¡Super promo! 3,000 vistas garantizadas en tus videos favoritos por solo $10.',
    popular: true,
    tag: 'Súper Promo 3K',
    image: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-saves',
    network: 'tiktok',
    name: 'Guardados (Favoritos)',
    metric: '1K Saves',
    price: 15,
    unit: '1,000 guardados',
    description: 'Los guardados tienen la mayor ponderación en el algoritmo de TikTok 2026.',
    image: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-coment',
    network: 'tiktok',
    name: 'Comentarios Activos TikTok',
    metric: '1K Coment.',
    price: 25,
    unit: '1,000 comentarios positivos',
    description: 'Conversación activa que genera debate e interacción genuina en tus videos.',
    image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-share',
    network: 'tiktok',
    name: 'Compartidos de Video',
    metric: '1K Share',
    price: 15,
    unit: '1,000 compartidos',
    description: 'Dispara la tasa de compartición para ingresar a tendencias virales rápidamente.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tt-mension',
    network: 'tiktok',
    name: 'Menciones Estratégicas',
    metric: '1K Mension',
    price: 30,
    unit: '1,000 menciones dirigidas',
    description: 'Menciona a usuarios objetivos en los comentarios de tu video para captar su atención.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  },

  // --- INSTAGRAM ---
  {
    id: 'ig-seg',
    network: 'instagram',
    name: 'Seguidores Perfil Instagram',
    metric: '1K Seg.',
    price: 15,
    unit: '1,000 seguidores',
    description: 'Crecimiento estético y seguro para tu perfil profesional, tienda o cuenta personal.',
    popular: true,
    tag: 'Top Ventas',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-lives',
    network: 'instagram',
    name: 'Espectadores en Instagram Live',
    metric: '1K Lives',
    price: 25,
    unit: '1,000 viewers en directo',
    description: 'Tus directos con sala llena para cerrar ventas o ganar autoridad.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-likes',
    network: 'instagram',
    name: 'Likes en Posts y Reels',
    metric: '1K Likes',
    price: 10,
    unit: '1,000 likes',
    description: 'Aumenta tus corazones al instante en publicaciones recientes o pasadas.',
    image: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-views',
    network: 'instagram',
    name: 'Vistas en Reels e Historias',
    metric: '1K Views',
    price: 10,
    unit: '1,000 reproducciones',
    description: 'Lanza tus Reels a la pestaña Explorar de miles de usuarios.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-saves',
    network: 'instagram',
    name: 'Guardados de Publicación',
    metric: '1K Saves',
    price: 20,
    unit: '1,000 guardados',
    description: 'La métrica favorita del algoritmo de Instagram para contenido de alto valor.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-coment',
    network: 'instagram',
    name: 'Comentarios Personalizados',
    metric: '1K Coment.',
    price: 30,
    unit: '1,000 comentarios',
    description: 'Comentarios de alta calidad con emojis acordes a tu contenido o producto.',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-share',
    network: 'instagram',
    name: 'Compartidos vía Direct / DM',
    metric: '1K Share',
    price: 20,
    unit: '1,000 compartidos',
    description: 'Muestra a Instagram que tu contenido se comparte intensamente por mensajería.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ig-mension',
    network: 'instagram',
    name: 'Menciones de Cuentas',
    metric: '1K Mension',
    price: 30,
    unit: '1,000 menciones',
    description: 'Etiquetado en masa para llamar la atención de clientes potenciales.',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
  },

  // --- YOUTUBE ---
  {
    id: 'yt-seg',
    network: 'youtube',
    name: 'Suscriptores de Canal YouTube',
    metric: '1K Seg.',
    price: 60,
    unit: '1,000 suscriptores',
    description: 'Suscriptores de alta calidad para cumplir los 1,000 suscriptores requeridos para monetizar.',
    popular: true,
    tag: 'Clave Monetización',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-lives',
    network: 'youtube',
    name: 'Espectadores en Transmisión en Vivo',
    metric: '1K Lives',
    price: 30,
    unit: '1,000 espectadores',
    description: 'Potencia el posicionamiento de tus transmisiones en directo en tiempo real.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-likes',
    network: 'youtube',
    name: 'Likes en Videos YouTube',
    metric: '1K Likes',
    price: 15,
    unit: '1,000 likes',
    description: 'Me Gustas verificados que envían señales positivas al algoritmo de búsqueda de YouTube.',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-views',
    network: 'youtube',
    name: 'Vistas en Videos YouTube',
    metric: '1K Views',
    price: 15,
    unit: '1,000 vistas',
    description: 'Vistas de alta retención para impulsar tus videos nuevos o shorts.',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-coment',
    network: 'youtube',
    name: 'Comentarios en YouTube',
    metric: '1K Coment.',
    price: 30,
    unit: '1,000 comentarios',
    description: 'Comentarios relevantes para hacer despegar la sección de opiniones.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-share',
    network: 'youtube',
    name: 'Compartidos Externos YouTube',
    metric: '1K Share',
    price: 30,
    unit: '1,000 compartidos',
    description: 'Genera tráfico externo compartiendo el enlace en redes y foros.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-mension',
    network: 'youtube',
    name: 'Menciones en Comunidad',
    metric: '1K Mension',
    price: 50,
    unit: '1,000 menciones',
    description: 'Menciones masivas en la pestaña de comunidad de YouTube.',
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'yt-1h-reprod',
    network: 'youtube',
    name: 'Horas de Reproducción Masivas',
    metric: '1H Reprod.',
    price: 130,
    unit: 'Paquete de Horas YouTube',
    description: 'Horas de alta retención diseñadas para cumplir con los requisitos oficiales de monetización.',
    popular: true,
    tag: 'Monetiza tu Canal',
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=800&q=80',
  },

  // --- KICK STREAMING (Página 3) ---
  {
    id: 'kick-v-1h',
    network: 'kick',
    name: 'Kick Viewers x 1 Hora',
    metric: '100 Viewers x 1H',
    price: 5,
    unit: '100 espectadores x 1 hora',
    description: '100 viewers activos durante 1 hora de transmisión en vivo en Kick.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-v-2h',
    network: 'kick',
    name: 'Kick Viewers x 2 Horas',
    metric: '100 Viewers x 2H',
    price: 7,
    unit: '100 espectadores x 2 horas',
    description: '100 viewers activos durante 2 horas continuas de stream.',
    popular: true,
    tag: 'Mejor relación',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-v-3h',
    network: 'kick',
    name: 'Kick Viewers x 3 Horas',
    metric: '100 Viewers x 3H',
    price: 9,
    unit: '100 espectadores x 3 horas',
    description: '100 viewers activos durante 3 horas de directo.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-v-4h',
    network: 'kick',
    name: 'Kick Viewers x 4 Horas',
    metric: '100 Viewers x 4H',
    price: 11,
    unit: '100 espectadores x 4 horas',
    description: '100 viewers activos durante 4 horas de sesión.',
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-v-5h',
    network: 'kick',
    name: 'Kick Viewers x 5 Horas',
    metric: '100 Viewers x 5H',
    price: 13,
    unit: '100 espectadores x 5 horas',
    description: '100 viewers activos durante 5 horas completas de maratón.',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-seg-100',
    network: 'kick',
    name: 'Kick 100 Seguidores',
    metric: '100 Seguidores',
    price: 5,
    unit: '100 seguidores',
    description: 'Comienza a construir la base de seguidores en tu canal de Kick.',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-seg-300',
    network: 'kick',
    name: 'Kick 300 Seguidores',
    metric: '300 Seguidores',
    price: 7,
    unit: '300 seguidores',
    description: 'Alcanza el nivel de afiliado de Kick más rápido.',
    image: 'https://images.unsplash.com/photo-1552824796-031f8be357e6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-seg-500',
    network: 'kick',
    name: 'Kick 500 Seguidores',
    metric: '500 Seguidores',
    price: 9,
    unit: '500 seguidores',
    description: 'Comunidad sólida para optar a programas de verificación de Kick.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kick-seg-1k',
    network: 'kick',
    name: 'Kick 1K Seguidores',
    metric: '1K Seguidores',
    price: 12,
    unit: '1,000 seguidores',
    description: '¡1,000 seguidores en Kick al mejor precio del mercado!',
    popular: true,
    tag: 'Recomendado Kick',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  },

  // --- SPOTIFY (Tarifario de Servicios Digitales) ---
  {
    id: 'spot-reprod-latam',
    network: 'spotify',
    name: 'Reproducciones dirigidas - America Latina S4 - ACTUALIZADO',
    metric: '1,000 Reprod. Latam',
    price: 15,
    unit: '1,000 reproducciones dirigidas',
    description: 'Streams geolocalizados para América Latina (S4 Actualizado). Posiciona tus lanzamientos en listas y rankings de la región.',
    popular: true,
    tag: 'S4 Actualizado',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-reprod-mundiales',
    network: 'spotify',
    name: 'Reproducciones - Mundiales',
    metric: '1,000 Reprod. Mundiales',
    price: 15,
    unit: '1,000 reproducciones globales',
    description: 'Reproducciones de audiencia global para internacionalizar tu música y elevar el contador total de reproducciones en Spotify.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-seg-latam',
    network: 'spotify',
    name: 'Seguidores - America latina',
    metric: '1,000 Seg. Latam',
    price: 15,
    unit: '1,000 seguidores de perfil de artista',
    description: 'Seguidores dirigidos a tu perfil de artista de Spotify ubicados en América Latina para hacer crecer tu fanaticada real.',
    popular: true,
    tag: 'Fans Latam',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-seg-global',
    network: 'spotify',
    name: 'Seguidores',
    metric: '1,000 Seguidores',
    price: 15,
    unit: '1,000 seguidores de perfil',
    description: 'Aumenta el número de seguidores en tu cuenta o perfil de artista en Spotify para dar peso y autoridad a tu proyecto.',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-reprod-pistas',
    network: 'spotify',
    name: 'Reproducciones (Pistas)',
    metric: '1,000 Reprod. Pistas',
    price: 15,
    unit: '1,000 reproducciones por pista',
    description: 'Streams directos aplicados a canciones o sencillos específicos para impulsar su popularidad y posicionamiento.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-anuncios-ads',
    network: 'spotify',
    name: 'Anuncios (ADS)',
    metric: '1,000 Anuncios (ADS)',
    price: 15,
    unit: '1,000 escuchas impulsadas por anuncios',
    description: 'Campañas de anuncios oficiales para promocionar tu música en Spotify con reproducciones auditadas de alta calidad.',
    tag: 'Spotify Ads',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-podcast',
    network: 'spotify',
    name: 'Podcast',
    metric: '1,000 Escuchas Podcast',
    price: 15,
    unit: '1,000 reproducciones de podcast',
    description: 'Escuchas y reproducciones continuas para episodios de podcast en Spotify para posicionar tu programa en el top de podcasts.',
    popular: true,
    tag: 'Podcast Pro',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-saves',
    network: 'spotify',
    name: 'Guardar (Saves)',
    metric: '1,000 Guardar (Saves)',
    price: 15,
    unit: '1,000 guardados en canciones favoritas',
    description: 'Canción guardada en las bibliotecas de los oyentes. La métrica número 1 para activar el algoritmo de recomendación de Spotify.',
    popular: true,
    tag: 'Clave Algoritmo',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-oyentes-mensuales',
    network: 'spotify',
    name: 'Oyentes Mensuales',
    metric: '1,000 Oyentes Mensuales',
    price: 15,
    unit: '1,000 oyentes mensuales verificados',
    description: 'Aumenta tus oyentes mensuales visibles en tu perfil de artista de Spotify. La métrica esencial para eventos y discográficas.',
    popular: true,
    tag: 'Métrica Estrella',
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spot-reprod-premium-pais',
    network: 'spotify',
    name: 'Reproducciones premium dirigidas por pais',
    metric: '1,000 Reprod. Premium País',
    price: 15,
    unit: '1,000 reproducciones premium por país',
    description: 'Streams de máxima retención provenientes de cuentas Spotify Premium dirigidas al país que selecciones.',
    tag: 'Cuentas Premium',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
  },
];

// Special Offers from Page 2
export const SPECIAL_OFFERS: SpecialPackage[] = [
  {
    id: 'special-yt-basic',
    network: 'youtube',
    title: 'Impulso YouTube Básico',
    subtitle: 'Oferta Especial "Solo por Hoy"',
    price: 15,
    description: '¡Haz crecer tu canal de inmediato con este paquete de interacción garantizada!',
    features: [
      '358 Likes garantizados',
      '1,000 Vistas en tu video preferido',
      'Entrega rápida y segura',
      'Sin contraseñas requeridas',
    ],
    isTodayOnly: true,
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'special-mega-ig-tt',
    network: 'instagram',
    title: 'Mega Crecimiento IG & TikTok',
    subtitle: '10,000 Seguidores + Alcance Masivo',
    price: 'consultar',
    description: 'Estrategia diseñada para hacerte crecer y preparar tu cuenta para monetizar.',
    features: [
      '10,000 Seguidores de alta calidad',
      'Aumenta tus Me Gustas, Vistas y Comentarios',
      'Multiplica tu Alcance orgánico',
      'Posicionamiento rápido en tu nicho',
    ],
    isTodayOnly: true,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'special-yt-viral',
    network: 'youtube',
    title: 'Plan YouTube Viral Masiva',
    subtitle: 'El paquete definitivo para posicionar tu contenido',
    price: 'consultar',
    description: 'Campaña masiva de gran escala para convertir cualquier video en una tendencia de la plataforma.',
    features: [
      '1 Millón de Visitas de alta retención',
      '10,000 Likes garantizados',
      '1,000 Comentarios personalizados',
      'Impulso en ranking de búsqueda de YouTube',
    ],
    isTodayOnly: true,
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  },
];

// Helper to create WhatsApp link with formatted pre-filled message
export function buildWhatsAppLink(
  message: string,
  phone: string = WHATSAPP_PHONE
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function buildSingleProductWhatsAppMessage(
  service: ServiceItem,
  usernameOrUrl?: string
): string {
  let msg = `🔥 ¡Hola! Vengo del Catálogo y me interesa el siguiente servicio:\n\n`;
  msg += `📌 *Servicio:* ${service.name} (${service.metric})\n`;
  msg += `🌐 *Red Social:* ${service.network.toUpperCase()}\n`;
  msg += `💵 *Precio:* $${service.price} USD\n`;
  if (usernameOrUrl && usernameOrUrl.trim()) {
    msg += `🔗 *Mi cuenta/enlace:* ${usernameOrUrl.trim()}\n`;
  }
  msg += `\n💳 *Método de Pago:* Confirmar tasa para Pago Móvil (BDV 0102 / Tel: ${PAGO_MOVIL_DATA.phone}) o Binance Pay (ID: ${BINANCE_PAY_ID}). ¡Quedo atento!`;
  return msg;
}

export function buildMultiOrderWhatsAppMessage(
  items: Array<{ name: string; metric: string; network: string; unitPrice: number; quantity: number }>,
  total: number,
  details: { usernameOrUrl: string; paymentMethod: string; clientNotes?: string }
): string {
  let msg = `🛒 *¡HOLA! QUIERO REALIZAR UN PEDIDO CONJUNTO*\n\n`;
  msg += `He seleccionado los siguientes servicios en el catálogo:\n`;
  msg += `─────────────────────────\n`;

  items.forEach((item, index) => {
    const subtotal = item.unitPrice * item.quantity;
    const qtyText = item.quantity > 1 ? ` (x${item.quantity})` : '';
    msg += `${index + 1}. *${item.name}* [${item.network.toUpperCase()}]\n`;
    msg += `   • Paquete: ${item.metric}${qtyText} ➜ *$${subtotal} USD*\n`;
  });

  msg += `─────────────────────────\n`;
  msg += `💰 *TOTAL A PAGAR:* *$${total} USD*\n\n`;
  msg += `👤 *Mi Enlace o Usuario:* ${details.usernameOrUrl.trim() || 'Te lo paso por aquí en el chat'}\n`;
  msg += `💳 *Método de Pago:* ${details.paymentMethod || `Pago Móvil (BDV 0102) / Binance Pay (${BINANCE_PAY_ID})`}\n`;

  if (details.clientNotes && details.clientNotes.trim()) {
    msg += `📝 *Detalles o notas:* ${details.clientNotes.trim()}\n`;
  }

  msg += `\n¿Me confirmas la tasa del día para transferir por Pago Móvil (BDV 0102 / ${PAGO_MOVIL_DATA.phone}) o transferirte por Binance (ID: ${BINANCE_PAY_ID})? ¡Gracias!`;
  return msg;
}

export interface UniversalPlatformPlanDetails {
  platformName: string;
  platformIcon: string;
  accountUrl: string;
  metrics: Array<{ label: string; current: number; missing: number; target: number; unit: string }>;
  recommendedPackages: Array<{ 
    name: string; 
    price: number; 
    detail: string;
    deliveryTime?: string;
    guarantee?: string;
  }>;
  deliverySpeed?: 'express' | 'progressive';
  totalEstimate: number;
}

export function buildUniversalMonetizationPlanWhatsAppMessage(plan: UniversalPlatformPlanDetails): string {
  const speedLabel = plan.deliverySpeed === 'progressive'
    ? '🌱 Ritmo Progresivo / Drip-Feed (3 a 7 días - Máxima protección algorítmica)'
    : '⚡ Entrega Express Acelerada (24 a 48 horas - Impulso urgente)';

  let msg = `🎯 *PLAN DE MONETIZACIÓN Y CRECIMIENTO [${plan.platformName.toUpperCase()}]*\n\n`;
  msg += `¡Hola! He diagnosticado mi cuenta en el catálogo y quiero ponerme de acuerdo contigo para monetizarla / cumplir las metas:\n\n`;
  msg += `🔗 *Enlace / Cuenta:* ${plan.accountUrl.trim() || 'Te lo paso por aquí en el chat'}\n`;
  msg += `🚀 *Ritmo de Entrega Solicitado:* ${speedLabel}\n`;
  msg += `🛡️ *Garantía Requerida:* 30 Días de Reposición Oficial Antidrop\n\n`;
  msg += `📊 *DIAGNÓSTICO OFICIAL DE MI CUENTA:*\n`;
  plan.metrics.forEach((m) => {
    msg += `• ${m.label}: ${m.current.toLocaleString()}${m.unit ? ' ' + m.unit : ''} ➜ *Faltan: ${m.missing.toLocaleString()}${m.unit ? ' ' + m.unit : ''}* (Meta: ${m.target.toLocaleString()})\n`;
  });
  msg += `\n📦 *PAQUETES DEL CATÁLOGO PARA MONETIZAR (CON GARANTÍA Y TIEMPO ESTIMADO):*\n`;
  plan.recommendedPackages.forEach((pkg, idx) => {
    const timeText = pkg.deliveryTime ? ` | ⏱️ ${pkg.deliveryTime}` : '';
    const guarText = pkg.guarantee ? ` | 🛡️ ${pkg.guarantee}` : '';
    msg += `${idx + 1}. *${pkg.name}* (${pkg.detail}${timeText}${guarText}) ➜ *$${pkg.price} USD*\n`;
  });
  msg += `─────────────────────────\n`;
  msg += `💰 *PRESUPUESTO TOTAL ESTIMADO:* *$${plan.totalEstimate} USD*\n\n`;
  msg += `🤝 *Quiero ponerme de acuerdo contigo por aquí:*\n`;
  msg += `Para confirmar la tasa para Pago Móvil (BDV 0102) o Binance Pay (ID: ${BINANCE_PAY_ID}), coordinar el inicio con la velocidad ${plan.deliverySpeed === 'progressive' ? 'Progresiva' : 'Express'} y recibir el soporte. ¡Quedo atento a tu respuesta!`;
  return msg;
}

export interface MonetizationPlanDetails {
  channelUrl: string;
  currentHours: number;
  missingHours: number;
  currentSubs: number;
  missingSubs: number;
  recommendedPackages: Array<{ name: string; price: number; detail: string }>;
  totalEstimate: number;
}

export function buildYouTubeMonetizationPlanWhatsAppMessage(plan: MonetizationPlanDetails): string {
  let msg = `🎯 *PLAN DE MONETIZACIÓN DE CANAL YOUTUBE*\n\n`;
  msg += `¡Hola! He diagnosticado mi canal en el catálogo y quiero ponerme de acuerdo contigo para monetizarlo:\n\n`;
  msg += `📺 *Canal de YouTube:* ${plan.channelUrl.trim() || 'Te lo facilito por aquí en el chat'}\n\n`;
  msg += `📊 *DIAGNÓSTICO OFICIAL (PROGRAMA DE SOCIOS):*\n`;
  msg += `• Horas de reproducción: ${plan.currentHours.toLocaleString()}h ➜ *Faltan: ${plan.missingHours.toLocaleString()}h* (Meta: 4,000h)\n`;
  msg += `• Suscriptores: ${plan.currentSubs.toLocaleString()} ➜ *Faltan: ${plan.missingSubs.toLocaleString()} subs* (Meta: 1,000)\n\n`;
  msg += `📦 *PAQUETES DEL CATÁLOGO PARA MONETIZAR:*\n`;
  plan.recommendedPackages.forEach((pkg, idx) => {
    msg += `${idx + 1}. *${pkg.name}* (${pkg.detail}) ➜ *$${pkg.price} USD*\n`;
  });
  msg += `─────────────────────────\n`;
  msg += `💰 *PRESUPUESTO TOTAL ESTIMADO:* *$${plan.totalEstimate} USD*\n\n`;
  msg += `🤝 *Quiero ponerme de acuerdo contigo por aquí:*\n`;
  msg += `Para coordinar el cronograma de entrega, la tasa para Pago Móvil (BDV 0102) o Binance Pay (ID: ${BINANCE_PAY_ID}) y comenzar con el impulso. ¡Quedo atento a tu respuesta!`;
  return msg;
}

export function buildYouTubeMonetizationWhatsAppMessage(
  currentHours: number,
  missingHours: number,
  channelUrl?: string
): string {
  let msg = `🎯 *CONSULTA: SERVICIO DE 4,000 HORAS YOUTUBE*\n\n`;
  msg += `¡Hola! Quiero monetizar mi canal de YouTube y solicitar el servicio de horas de reproducción.\n\n`;
  msg += `📊 *Mis horas actuales:* ${currentHours.toLocaleString()} horas\n`;
  msg += `⚡ *Horas que me faltan:* ${missingHours.toLocaleString()} horas para alcanzar las 4,000h oficiales\n`;
  if (channelUrl && channelUrl.trim()) {
    msg += `📺 *Canal de YouTube:* ${channelUrl.trim()}\n`;
  }
  msg += `\n¿Cuál sería el presupuesto y el tiempo de entrega para completar mis 4,000 horas y postular al Programa de Socios? ¡Gracias!`;
  return msg;
}
