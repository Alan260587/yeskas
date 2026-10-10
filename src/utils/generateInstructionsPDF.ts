import { jsPDF } from 'jspdf';
import { 
  WHATSAPP_DISPLAY, 
  BINANCE_PAY_ID, 
  PAGO_MOVIL_DATA 
} from '../data/catalogData';

export function generateInstructionsPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const purpleDark = [76, 29, 149]; // #4c1d95
  const purplePrimary = [124, 58, 237]; // #7c3aed
  const purpleLight = [243, 232, 255]; // #f3e8ff
  const zinc900 = [24, 24, 27];
  const zinc800 = [39, 39, 42];
  const zinc700 = [63, 63, 70];
  const zinc500 = [113, 113, 122];
  const emerald = [16, 185, 129];
  const emeraldLight = [209, 250, 229];
  const blue = [2, 132, 199];
  const blueLight = [224, 242, 254];

  let currentPage = 1;
  const totalPages = 5;

  const addHeader = (sectionTitle: string) => {
    // Header bar
    doc.setFillColor(zinc900[0], zinc900[1], zinc900[2]);
    doc.rect(margin, 10, contentWidth, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('GROWTH VIRAL PRO • MANUAL OFICIAL DE USO Y VENTAS', margin + 4, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(190, 190, 200);
    doc.text(sectionTitle, pageWidth - margin - 4, 18, { align: 'right' });

    // Underline
    doc.setDrawColor(purplePrimary[0], purplePrimary[1], purplePrimary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, 23, pageWidth - margin, 23);
  };

  const addFooter = () => {
    // Top line
    doc.setDrawColor(zinc700[0], zinc700[1], zinc700[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(zinc500[0], zinc500[1], zinc500[2]);
    doc.text(`WhatsApp de Ventas: ${WHATSAPP_DISPLAY} | Binance ID: ${BINANCE_PAY_ID} | Pago Móvil BDV`, margin, pageHeight - 9);

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  /* =========================================================================
     PÁGINA 1: PORTADA Y RESUMEN EJECUTIVO DEL SISTEMA
     ========================================================================= */
  // Background decoration
  doc.setFillColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative header gradient simulation
  doc.setFillColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  doc.roundedRect(margin, 18, contentWidth, 58, 4, 4, 'F');

  // Brand Badge
  doc.setFillColor(190, 24, 93); // Pink badge
  doc.roundedRect(margin + 6, 26, 44, 6, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('GROWTH VIRAL PRO', margin + 8, 30.5);

  // Main Cover Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUAL E INSTRUCTIVO OFICIAL', margin + 6, 43);

  doc.setFontSize(12);
  doc.setTextColor(233, 213, 255); // soft violet
  doc.text('Centro de Diagnóstico, Monetización y Ventas Multi-Red', margin + 6, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 215);
  doc.text('Guía paso a paso: Cómo se usa, Qué ve el Cliente, Qué ves Tú y Qué te llega por WhatsApp.', margin + 6, 60);
  doc.text(`Actualizado para YouTube, TikTok, Instagram, Facebook, Kick y Spotify.`, margin + 6, 66);

  // Cards summary grid on cover
  const cardY = 82;
  const colW = (contentWidth - 6) / 2;

  // Box 1: Qué ve el Cliente
  doc.setFillColor(zinc800[0], zinc800[1], zinc800[2]);
  doc.roundedRect(margin, cardY, colW, 46, 3, 3, 'F');
  doc.setDrawColor(purplePrimary[0], purplePrimary[1], purplePrimary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, colW, 46, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('1. QUE VE EL CLIENTE (Comprador)', margin + 5, cardY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  const textC1 = [
    '• Analizador visual por red social (enlace + métricas).',
    '• Cálculo en tiempo real de lo que le falta para monetizar.',
    '• Paquetes exactos sugeridos con precio en USD y Bs.',
    '• Simulador de ROI (cuánto ganará y en cuántos días).',
    '• Botón de WhatsApp que envía su pedido pre-redactado.',
  ];
  let cY = cardY + 15;
  textC1.forEach(t => {
    doc.text(t, margin + 5, cY);
    cY += 6;
  });

  // Box 2: Qué ves Tú (Administrador)
  const xCol2 = margin + colW + 6;
  doc.setFillColor(zinc800[0], zinc800[1], zinc800[2]);
  doc.roundedRect(xCol2, cardY, colW, 46, 3, 3, 'F');
  doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(xCol2, cardY, colW, 46, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('2. QUE VES TU (Administrador)', xCol2 + 5, cardY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  const textC2 = [
    '• Inventario completo de servicios y promociones.',
    '• Control de márgenes de ganancia por red social.',
    '• Recepción de enlaces de clientes listos para procesar.',
    '• Datos de cobro claros: Pago Móvil (BDV) y Binance Pay.',
    '• Detección del déficit para hacer venta cruzada (upsell).',
  ];
  let cY2 = cardY + 15;
  textC2.forEach(t => {
    doc.text(t, xCol2 + 5, cY2);
    cY2 += 6;
  });

  // Box 3: Qué te llega por WhatsApp
  const cardY3 = cardY + 52;
  doc.setFillColor(zinc800[0], zinc800[1], zinc800[2]);
  doc.roundedRect(margin, cardY3, contentWidth, 52, 3, 3, 'F');
  doc.setDrawColor(blue[0], blue[1], blue[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY3, contentWidth, 52, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('3. QUE TE LLEGA POR WHATSAPP (Estructura del Mensaje Recibido)', margin + 6, cardY3 + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 212, 216);
  const textC3 = [
    '• Mensaje 100% formateado con emojis, listo para cerrar la venta.',
    '• Enlace de la cuenta o canal del cliente para verificarlo sin rodeos.',
    '• Resumen de métricas: lo que tiene actualmente y lo que le falta exactamente para la meta oficial.',
    '• Lista de paquetes del catálogo seleccionados con precios individuales y Presupuesto Total ($ USD).',
    '• Instrucciones de pago precargadas para Binance Pay y Pago Móvil del Banco de Venezuela.',
    '• El cliente solo debe presionar Enviar y tú solo respondes con la tasa y la cuenta.',
  ];
  let cY3 = cardY3 + 17;
  textC3.forEach(t => {
    doc.text(t, margin + 6, cY3);
    cY3 += 5.5;
  });

  // Official Contact and Payment Summary Banner
  const infoY = cardY3 + 58;
  doc.setFillColor(15, 23, 42); // slate 900
  doc.roundedRect(margin, infoY, contentWidth, 34, 3, 3, 'F');
  doc.setDrawColor(zinc700[0], zinc700[1], zinc700[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, infoY, contentWidth, 34, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // emerald 400
  doc.text('DATOS DE OPERACIÓN OFICIALES:', margin + 6, infoY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(228, 228, 231);
  doc.text(`• WhatsApp Oficial de Ventas: ${WHATSAPP_DISPLAY}`, margin + 6, infoY + 14);
  doc.text(`• Binance Pay ID Oficial: ${BINANCE_PAY_ID} (Pagos en USDT sin comisiones)`, margin + 6, infoY + 20);
  doc.text(`• Pago Móvil: ${PAGO_MOVIL_DATA.bank} (${PAGO_MOVIL_DATA.bankCode}) | Tlf: ${PAGO_MOVIL_DATA.phone} | C.I.: ${PAGO_MOVIL_DATA.id}`, margin + 6, infoY + 26);

  addFooter();

  /* =========================================================================
     PÁGINA 2: SECCIÓN 1 - ¿CÓMO SE USA EL SISTEMA? (FLUJO COMPLETO)
     ========================================================================= */
  doc.addPage();
  currentPage = 2;
  addHeader('SECCIÓN 1: CÓMO SE USA EL SISTEMA');

  let curY = 32;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.text('1. Guía de Operación y Flujo de Trabajo', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
  const introP = 'El sistema Growth Viral Pro está diseñado para que cualquier creador de contenido o dueño de negocio pueda diagnosticar de manera instantánea el estado de su cuenta, calcular exactamente qué necesita para monetizar, y conectarse directamente contigo por WhatsApp para pagar y recibir el servicio sin fricción ni registros complicados.';
  const splitIntro = doc.splitTextToSize(introP, contentWidth);
  doc.text(splitIntro, margin, curY);
  curY += splitIntro.length * 4.2 + 4;

  // Step 1 Box
  const drawStepBox = (num: string, title: string, desc: string[], color: number[]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, curY, contentWidth, 29, 2.5, 2.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, curY, contentWidth, 29, 2.5, 2.5, 'D');

    // Number bubble
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(margin + 7, curY + 7, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(num, margin + 7, curY + 8.5, { align: 'center' });

    // Step Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
    doc.text(title, margin + 14, curY + 8);

    // Bullet lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
    let lineY = curY + 14;
    desc.forEach(d => {
      doc.text(d, margin + 14, lineY);
      lineY += 4.5;
    });

    curY += 32;
  };

  drawStepBox(
    '1',
    'Paso 1: Selección de la Plataforma a Diagnosticar',
    [
      '• El usuario o tú seleccionan entre YouTube, TikTok, Instagram, Facebook, Kick Streaming o Spotify.',
      '• Cada plataforma carga automáticamente las reglas y umbrales de monetización oficial vigentes para 2026.',
      '• Se despliegan métricas clave: suscriptores, horas, seguidores, minutos o streams según la red.',
    ],
    purplePrimary
  );

  drawStepBox(
    '2',
    'Paso 2: Ingreso de Enlace y Ajuste de Estadísticas Actuales',
    [
      '• Se pega la URL pública del canal, perfil o canción (ej. youtube.com/@micuenta o @usuario).',
      '• Con los sliders interactivos o presets rápidos, se indica la cantidad de seguidores/horas que ya posee.',
      '• No se solicitan contraseñas ni accesos privados: el servicio es 100% seguro y externo.',
    ],
    blue
  );

  drawStepBox(
    '3',
    'Paso 3: Diagnóstico Automatizado de Faltantes',
    [
      '• El motor calcula la brecha exacta: (Meta Oficial - Cantidad Actual = Cantidad Faltante).',
      '• Muestra porcentaje de progreso con barras visuales y estado: "En Proceso" o "Meta Alcanzada".',
      '• Si el cliente ya superó un requisito, el sistema lo marca en verde y no le cobra de más.',
    ],
    emerald
  );

  drawStepBox(
    '4',
    'Paso 4: Recomendación Inteligente de Paquetes del Catálogo',
    [
      '• El algoritmo cruza el déficit con los paquetes de inventario con mejor relación precio/beneficio.',
      '• Incluye garantías (ej. 30 días de reposición) y tiempos estimados de entrega (entrega progresiva o express).',
      '• Permite añadir al Carrito de Pedidos Consolidado o pedir directamente por WhatsApp.',
    ],
    [217, 119, 6] // Amber
  );

  drawStepBox(
    '5',
    'Paso 5: Simulador de Retorno de Inversión (ROI) y Cierre por WhatsApp',
    [
      '• Proyecta cuánto dinero ganará el cliente una vez monetizado y en cuántos días recupera su inversión.',
      '• Con un solo clic en "Pedir Plan por WhatsApp", se abre el chat directo con el mensaje listo.',
      '• Tú recibes la solicitud completa y procedes a coordinar el pago por Binance Pay o Pago Móvil.',
    ],
    [16, 185, 129] // Emerald
  );

  addFooter();

  /* =========================================================================
     PÁGINA 3: SECCIÓN 2 - ¿QUÉ VE EL CLIENTE? (EXPERIENCIA DEL COMPRADOR)
     ========================================================================= */
  doc.addPage();
  currentPage = 3;
  addHeader('SECCIÓN 2: QUÉ VE EL CLIENTE');

  curY = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.text('2. La Interfaz y Experiencia Visual del Comprador', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
  const clientIntro = 'El cliente interactúa con una interfaz moderna, oscura y ultra responsiva (diseñada para celulares y computadoras). Todo está pensado para transmitir autoridad profesional, confianza y cero fricción.';
  const splitClient = doc.splitTextToSize(clientIntro, contentWidth);
  doc.text(splitClient, margin, curY);
  curY += splitClient.length * 4.2 + 5;

  // Component breakdown for Client View
  const clientFeatures = [
    {
      title: 'A. Selector de Redes con Pestañas de Color y Emojis',
      desc: 'Ve 6 pestañas destacadas: YouTube (Rojo), TikTok (Cian/Rosa), Instagram (Fucsia), Facebook (Azul), Kick (Verde Neón) y Spotify (Verde Esmeralda). Al tocar una red, la interfaz se adapta al instante.',
    },
    {
      title: 'B. Input de Enlace y Control Deslizante de Métricas (Sliders)',
      desc: 'Un campo claro donde coloca su link. Abajo, sliders suaves con botones rápidos (ej: 0, 500, 1500, 3500 horas) para que el cliente no tenga que escribir números difíciles, haciéndolo divertido y ágil.',
    },
    {
      title: 'C. Tarjeta de Diagnóstico en Tiempo Real',
      desc: 'Una tarjeta con badges donde se resalta en rojo/ámbar lo que le falta (ej. "Te faltan 2,800 horas y 650 subs") y en verde lo que ya tiene completado. El cliente visualiza claramente el tamaño de su meta.',
    },
    {
      title: 'D. Desglose de Paquetes Asignados con Precios Claros',
      desc: 'Ve exactamente qué servicios le resuelven su falta: por ejemplo, "Combo 3,000 Horas de Reproducción ($65 USD) + 700 Suscriptores ($28 USD)". Ve el total consolidado sin sorpresas ni cargos ocultos.',
    },
    {
      title: 'E. Simulador de ROI (Retorno de Inversión Post-Monetización)',
      desc: 'El cliente ve una estimación de ingresos mensuales futuros (ej. $180 - $350 USD/mes), cuánto tardará en recuperar su inversión (ej. 30 a 45 días) y el multiplicador de rentabilidad de su canal.',
    },
    {
      title: 'F. Botón Gigante de WhatsApp con Pre-Carga de Datos',
      desc: 'Un botón verde esmeralda con el texto "Pedir Plan de Monetización por WhatsApp (+58 424 2934550)". Al pulsarlo, no tiene que redactar nada; WhatsApp se abre con todo su pedido listo para enviar.',
    },
  ];

  clientFeatures.forEach((feat) => {
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, curY, contentWidth, 21, 2, 2, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, curY, contentWidth, 21, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
    doc.text(feat.title, margin + 4, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(zinc800[0], zinc800[1], zinc800[2]);
    const splitFeatDesc = doc.splitTextToSize(feat.desc, contentWidth - 8);
    doc.text(splitFeatDesc, margin + 4, curY + 11.5);

    curY += 23.5;
  });

  // Client peace-of-mind guarantee box
  doc.setFillColor(emeraldLight[0], emeraldLight[1], emeraldLight[2]);
  doc.roundedRect(margin, curY + 2, contentWidth, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('GARANTÍA VISIBLE PARA EL CLIENTE:', margin + 4, curY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.text('El cliente ve que los servicios no requieren contraseña, tienen 30 días de garantía de reposición y se activan en un plazo de 12 a 24 horas hábiles.', margin + 4, curY + 14);

  addFooter();

  /* =========================================================================
     PÁGINA 4: SECCIÓN 3 - ¿QUÉ VES TÚ? (PANEL Y ROL DEL ADMINISTRADOR)
     ========================================================================= */
  doc.addPage();
  currentPage = 4;
  addHeader('SECCIÓN 3: QUÉ VES TÚ (ADMINISTRADOR)');

  curY = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.text('3. Tu Panel de Control, Márgenes y Gestión de Pagos', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
  const adminIntro = 'Como administrador y vendedor de Growth Viral Pro, tienes a tu disposición una herramienta de alta conversión que educa al cliente antes de que llegue a tu WhatsApp. Cuando el cliente te escribe, ya sabe qué necesita y cuánto cuesta.';
  const splitAdmin = doc.splitTextToSize(adminIntro, contentWidth);
  doc.text(splitAdmin, margin, curY);
  curY += splitAdmin.length * 4.2 + 5;

  const adminRoles = [
    {
      title: '1. Control Integral de Inventario y Tarifas',
      desc: 'En el catálogo tienes cargadas las 6 plataformas con sus precios en USD, cantidades mínimas/máximas y tiempos de entrega. Puedes verificar cualquier servicio o promoción directamente en el catálogo web.',
    },
    {
      title: '2. Detección de Déficit para Venta Cruzada (Upselling)',
      desc: 'Cuando un cliente te envía su mensaje con su diagnóstico, ves al segundo si solo le faltan seguidores o también likes y comentarios. Esto te permite ofrecerle un "Pack de Retención" o "Interacciones Extra" para aumentar el ticket promedio de compra.',
    },
    {
      title: '3. Canales de Cobro Pre-Configurados',
      desc: 'La app ya le informa al cliente que puedes cobrar mediante:\n• Binance Pay (ID: 965190483): Cero comisiones en USDT, instantáneo para clientes internacionales y nacionales.\n• Pago Móvil: Banco de Venezuela (0102), tlf 04242934550, CI 28525460. Tú solo indicas la tasa del día para calcular los Bolívares.',
    },
    {
      title: '4. Recepción de Enlace Verificado',
      desc: 'El cliente ya adjunta su enlace en el mensaje de WhatsApp. Solo tienes que hacer clic para abrir el perfil/canal, revisar que el contenido sea público y apto para monetizar, y confirmar la orden.',
    },
    {
      title: '5. Coordinación del Despacho y Monitoreo',
      desc: 'Una vez recibido el capture del pago, programas la entrega (progresiva de 3 a 5 días para mayor naturalidad algorítmica o express en 24-48h). Respaldas la orden con la garantía de 30 días de reposición.',
    },
  ];

  adminRoles.forEach((role) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, curY, contentWidth, 23.5, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, curY, contentWidth, 23.5, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
    doc.text(role.title, margin + 4, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
    const splitRDesc = doc.splitTextToSize(role.desc, contentWidth - 8);
    doc.text(splitRDesc, margin + 4, curY + 11.5);

    curY += 26;
  });

  // Profit Tip Box
  doc.setFillColor(purpleLight[0], purpleLight[1], purpleLight[2]);
  doc.roundedRect(margin, curY + 2, contentWidth, 19, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
  doc.text('CONSEJO DE VENTAS PRO:', margin + 4, curY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.text('Si el cliente tiene un presupuesto ajustado, ofrécele comprar primero la mitad del déficit (ej. 2,000 horas de YouTube o 5,000 seguidores de TikTok). Una vez que compruebe la calidad y velocidad, te comprará el resto para completar su meta.', margin + 4, curY + 13.5);

  addFooter();

  /* =========================================================================
     PÁGINA 5: SECCIÓN 4 - ¿QUÉ TE LLEGA POR WHATSAPP? (EJEMPLO REAL Y CIERRE)
     ========================================================================= */
  doc.addPage();
  currentPage = 5;
  addHeader('SECCIÓN 4: QUÉ TE LLEGA POR WHATSAPP');

  curY = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.text('4. Estructura del Mensaje Recibido y Guión de Cierre', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(zinc700[0], zinc700[1], zinc700[2]);
  const waIntro = 'A continuación se muestra el formato exacto del texto que genera la aplicación cuando el cliente pulsa el botón de WhatsApp. El mensaje contiene todos los datos comerciales estructurados:';
  const splitWa = doc.splitTextToSize(waIntro, contentWidth);
  doc.text(splitWa, margin, curY);
  curY += splitWa.length * 4.2 + 4;

  // WhatsApp Message Simulation Box
  const waBoxH = 68;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(margin, curY, contentWidth, waBoxH, 3, 3, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, curY, contentWidth, waBoxH, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('📱 EJEMPLO REAL DE MENSAJE QUE TE LLEGA AL WHATSAPP:', margin + 5, curY + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(24, 24, 27);

  const sampleLines = [
    '🎯 PLAN DE MONETIZACIÓN OFICIAL: YOUTUBE',
    '¡Hola! He diagnosticado mi cuenta en el catálogo y quiero coordinar mi pedido:',
    '📺 Enlace o usuario: https://youtube.com/@mi_canal_creador',
    '📊 SITUACIÓN ACTUAL VS REQUISITOS:',
    '• Horas de reproducción: 1,200h ➜ Faltan: 2,800h (Meta: 4,000h)',
    '• Suscriptores: 350 subs ➜ Faltan: 650 subs (Meta: 1,000 subs)',
    '📦 PAQUETES DEL CATÁLOGO PARA MONETIZAR (CON GARANTÍA):',
    '1. 3,000 Horas de Reproducción YouTube (Garantía 30 días) ➜ $65 USD',
    '2. 1,000 Suscriptores Reales YouTube (Garantía 30 días) ➜ $35 USD',
    '────────────────────────────────────────────────────────────',
    '💰 PRESUPUESTO TOTAL ESTIMADO: $100 USD',
    '🤝 Quiero ponerme de acuerdo contigo por aquí:',
    'Para confirmar la tasa para Pago Móvil (BDV 0102) o Binance Pay (ID: 965190483),',
    'coordinar el inicio progresivo y recibir el soporte. ¡Quedo atento!',
  ];

  let sampleY = curY + 13;
  sampleLines.forEach((sLine) => {
    doc.text(sLine, margin + 5, sampleY);
    sampleY += 3.8;
  });

  curY += waBoxH + 6;

  // Closing script box (3 steps for seller)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(zinc900[0], zinc900[1], zinc900[2]);
  doc.text('Guión de Cierre en 3 Pasos para Ti (Copia y Pega):', margin, curY);
  curY += 6;

  const scriptSteps = [
    {
      paso: 'Respuesta 1 (Inmediata):',
      texto: '"¡Hola! Con gusto te ayudo a completar tu monetización de YouTube. He revisado tu canal y está perfecto para iniciar. El total es de $100 USD."',
    },
    {
      paso: 'Respuesta 2 (Cotización de Pago):',
      texto: '"¿Prefieres cancelar por Binance Pay en USDT ($100 neto sin comisión a mi ID 965190483) o por Pago Móvil del Banco de Venezuela a la tasa del día?"',
    },
    {
      paso: 'Respuesta 3 (Inicio de Campaña):',
      texto: '"Una vez envíes el comprobante, activamos la entrega en las próximas horas de forma progresiva para proteger y hacer crecer tu canal con total seguridad."',
    },
  ];

  scriptSteps.forEach((s) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, curY, contentWidth, 16.5, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, curY, contentWidth, 16.5, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(purpleDark[0], purpleDark[1], purpleDark[2]);
    doc.text(s.paso, margin + 4, curY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(zinc800[0], zinc800[1], zinc800[2]);
    const splitStepText = doc.splitTextToSize(s.texto, contentWidth - 8);
    doc.text(splitStepText, margin + 4, curY + 10.5);

    curY += 19;
  });

  addFooter();

  // Save the PDF file
  const fileName = 'Instructivo_Monetizacion_Growth_Viral_Pro.pdf';
  doc.save(fileName);
  return fileName;
}
