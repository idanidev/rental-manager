import jsPDF from "jspdf";

/**
 * Servicio profesional para generar PDFs de anuncios inmobiliarios
 * Diseño premium inspirado en Idealista/Fotocasa de alta gama
 */
export const pdfService = {
  // Paleta de colores premium inmobiliaria
  colors: {
    // Primarios
    navy: [15, 23, 42], // Azul marino profundo - elegancia
    gold: [202, 138, 4], // Dorado/mostaza - premium
    emerald: [16, 185, 129], // Verde esmeralda - disponible/positivo

    // Neutros
    charcoal: [30, 41, 59], // Casi negro elegante
    slate: [71, 85, 105], // Gris pizarra
    stone: [120, 113, 108], // Gris piedra cálido
    pearl: [248, 250, 252], // Blanco perla
    cream: [254, 252, 247], // Crema suave
    white: [255, 255, 255],

    // Acentos
    coral: [251, 113, 133], // Para destacar
    sky: [56, 189, 248], // Azul cielo
  },

  /**
   * Genera un PDF de anuncio inmobiliario premium
   */
  async generateRoomAd(roomData) {
    const {
      roomName,
      propertyName,
      propertyAddress,
      monthlyRent,
      sizeSqm,
      description,
      photos = [],
      commonRooms = [],
      depositAmount = null,
      expenses = null,
      ownerContact = null,
      availableFrom = null,
      amenities = [],
    } = roomData;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    let yPosition = 0;

    // ============================================
    // HEADER COMPACTO Y ELEGANTE (SIN FOTO)
    // ============================================
    const headerHeight = 38;

    // Fondo elegante
    doc.setFillColor(...this.colors.navy);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Línea dorada decorativa
    doc.setFillColor(...this.colors.gold);
    doc.rect(0, headerHeight - 3, pageWidth, 3, "F");

    // Badge "EN ALQUILER" - izquierda
    const badgeText = "EN ALQUILER";
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const badgeWidth = doc.getTextWidth(badgeText) + 12;
    const badgeHeight = 16;

    doc.setFillColor(...this.colors.emerald);
    doc.roundedRect(margin, 8, badgeWidth, badgeHeight, 2, 2, "F");
    doc.setTextColor(...this.colors.white);
    // Centrar texto verticalmente
    const badgeTextWidth = doc.getTextWidth(badgeText);
    const badgeTextX = margin + (badgeWidth - badgeTextWidth) / 2;
    const badgeTextY = 8 + badgeHeight / 2 + 1;
    doc.text(badgeText, badgeTextX, badgeTextY);

    // Título principal - centro (SIN nombre privado de habitación)
    let titleText = "Habitación en alquiler";
    if (propertyName) {
      const propLower = propertyName.toLowerCase();
      if (propLower.includes("chalet")) {
        titleText = "Habitación en chalet";
      } else if (propLower.includes("piso")) {
        titleText = "Habitación en piso";
      } else if (propLower.includes("casa")) {
        titleText = "Habitación en casa";
      }
    }

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text(titleText, pageWidth / 2, 18, { align: "center" });

    // Ubicación - centro debajo del título
    if (propertyAddress) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.pearl);
      doc.text(propertyAddress, pageWidth / 2, 28, { align: "center" });
    }

    // Precio - derecha
    const rentAmount = parseFloat(monthlyRent || 0).toFixed(0); // Badge precio - derecha (MISMA ALTURA que "EN ALQUILER")
    const priceText = `${rentAmount}€`;
    const priceSubtext = "/mes";
    doc.setFontSize(14); // Reducido para que quepa en 16px
    const priceWidth = doc.getTextWidth(priceText);
    doc.setFontSize(7);
    const subWidth = doc.getTextWidth(priceSubtext);
    const totalPriceWidth = priceWidth + subWidth + 20;

    // Fondo del precio - MISMA ALTURA 16px
    doc.setFillColor(...this.colors.gold);
    doc.roundedRect(
      pageWidth - margin - totalPriceWidth,
      8,
      totalPriceWidth,
      16, // Cambiado de 24 a 16
      3,
      3,
      "F",
    );

    // Texto precio - centrado (IGUAL que EN ALQUILER)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    const price14Width = doc.getTextWidth(priceText);
    doc.setFontSize(7);
    const sub7Width = doc.getTextWidth(priceSubtext);
    const totalTextWidth = price14Width + sub7Width + 2;

    const priceStartX =
      pageWidth -
      margin -
      totalPriceWidth +
      (totalPriceWidth - totalTextWidth) / 2;
    const priceY = 8 + 16 / 2 + 2.5; // Ajustado para centrado perfecto

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(priceText, priceStartX, priceY);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(priceSubtext, priceStartX + price14Width + 2, priceY);

    yPosition = headerHeight + 6;

    // ============================================
    // BARRA DE CARACTERÍSTICAS RÁPIDAS
    // ============================================
    const quickFeatures = [];

    if (sizeSqm) quickFeatures.push({ text: `${sizeSqm} m²` });

    // Detectar características de zonas comunes
    const hasPool = commonRooms.some((r) =>
      r.name?.toLowerCase().includes("piscina"),
    );
    const hasGarden = commonRooms.some(
      (r) =>
        r.name?.toLowerCase().includes("jardin") ||
        r.name?.toLowerCase().includes("jardín"),
    );
    const hasParking = commonRooms.some(
      (r) =>
        r.name?.toLowerCase().includes("parking") ||
        r.name?.toLowerCase().includes("garaje"),
    );
    const hasTerrace = commonRooms.some((r) =>
      r.name?.toLowerCase().includes("terraza"),
    );
    const hasKitchen = commonRooms.some((r) =>
      r.name?.toLowerCase().includes("cocina"),
    );
    const hasLiving = commonRooms.some(
      (r) =>
        r.name?.toLowerCase().includes("salón") ||
        r.name?.toLowerCase().includes("salon"),
    );

    if (hasPool) quickFeatures.push({ text: "Piscina" });
    if (hasGarden) quickFeatures.push({ text: "Jardín" });
    if (hasTerrace) quickFeatures.push({ text: "Terraza" });
    if (hasParking) quickFeatures.push({ text: "Parking" });
    if (hasKitchen) quickFeatures.push({ text: "Cocina compartida" });
    if (hasLiving) quickFeatures.push({ text: "Salón" });
    quickFeatures.push({ text: "WiFi" });

    if (quickFeatures.length > 0) {
      // Fondo de la barra
      doc.setFillColor(...this.colors.pearl);
      doc.rect(0, yPosition, pageWidth, 28, "F");

      // Línea superior decorativa
      doc.setFillColor(...this.colors.gold);
      doc.rect(0, yPosition, pageWidth, 2, "F");

      // Calcular anchos de cada chip
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const chipPadding = 16;
      const chipGap = 8;
      const chipHeight = 20;

      const chipWidths = quickFeatures.map(
        (feat) => doc.getTextWidth(feat.text) + chipPadding,
      );
      const totalChipsWidth =
        chipWidths.reduce((sum, w) => sum + w, 0) +
        (quickFeatures.length - 1) * chipGap;

      // Centrar los chips
      let chipX = (pageWidth - totalChipsWidth) / 2;
      const chipY = yPosition + 4;

      quickFeatures.forEach((feat, idx) => {
        const chipWidth = chipWidths[idx];

        // Fondo del chip
        doc.setFillColor(...this.colors.white);
        doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 10, 10, "F");

        // Borde sutil
        doc.setDrawColor(...this.colors.slate);
        doc.setLineWidth(0.3);
        doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 10, 10, "S");

        // Texto centrado horizontal Y verticalmente
        doc.setTextColor(...this.colors.charcoal);
        const textWidth = doc.getTextWidth(feat.text);
        const textX = chipX + (chipWidth - textWidth) / 2;
        const textY = chipY + chipHeight / 2 + 1; // Centrado vertical
        doc.text(feat.text, textX, textY);

        chipX += chipWidth + chipGap;
      });

      yPosition += 28;
    }

    // ============================================
    // SECCIÓN: INFO FINANCIERA (3 columnas CENTRADAS)
    // ============================================
    const infoBoxY = yPosition;
    const infoBoxHeight = 42;
    const boxGap = 8;
    const colWidth = (pageWidth - 2 * margin - 2 * boxGap) / 3;

    // Calcular posición inicial para centrar
    const totalBoxesWidth = colWidth * 3 + boxGap * 2;
    const startX = (pageWidth - totalBoxesWidth) / 2;

    // Box 1: Alquiler mensual
    this._drawPremiumInfoBox(doc, startX, infoBoxY, colWidth, infoBoxHeight, {
      label: "ALQUILER",
      value: `${rentAmount}€`,
      subtext: expenses || "Gastos no incluidos",
      accentColor: this.colors.navy,
      icon: "€",
    });

    // Box 2: Fianza
    const depositText = depositAmount
      ? `${parseFloat(depositAmount).toFixed(0)}€`
      : `${rentAmount}€`;
    this._drawPremiumInfoBox(
      doc,
      startX + colWidth + boxGap,
      infoBoxY,
      colWidth,
      infoBoxHeight,
      {
        label: "FIANZA",
        value: depositText,
        subtext: "Reembolsable",
        accentColor: this.colors.slate,
        icon: "🔒",
      },
    );

    // Box 3: Disponibilidad
    const availText = availableFrom
      ? new Date(availableFrom).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        })
      : "Inmediata";
    this._drawPremiumInfoBox(
      doc,
      startX + 2 * (colWidth + boxGap),
      infoBoxY,
      colWidth,
      infoBoxHeight,
      {
        label: "DISPONIBLE",
        value: availText,
        subtext: "Entrada flexible",
        accentColor: this.colors.emerald,
        icon: "✓",
      },
    );

    yPosition += infoBoxHeight + 8;

    // ============================================
    // SECCIÓN: DESCRIPCIÓN
    // ============================================
    if (description && description.trim()) {
      this._drawSectionTitle(doc, "Sobre esta habitación", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.slate);

      const descLines = doc.splitTextToSize(
        description,
        pageWidth - 2 * margin,
      );
      const maxLines = 5;
      doc.text(descLines.slice(0, maxLines), margin, yPosition);
      yPosition += Math.min(descLines.length, maxLines) * 4.5 + 6;
    }

    // ============================================
    // FOTOS DE LA HABITACIÓN
    // ============================================
    if (photos.length > 0) {
      // Verificar espacio
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      this._drawSectionTitle(doc, "Fotos", margin, yPosition);
      yPosition += 8;

      const photoGap = 6;
      const fullWidth = pageWidth - 2 * margin;
      const halfWidth = (fullWidth - photoGap) / 2;

      let col = 0;
      let rowY = yPosition;
      let rowHeights = [0, 0];

      // Mostrar TODAS las fotos de la habitación
      for (let i = 0; i < photos.length; i++) {
        try {
          const photoUrl =
            typeof photos[i] === "string"
              ? photos[i]
              : photos[i].url || photos[i];
          const imgData = await this.loadImageAsBase64(photoUrl);

          if (imgData) {
            // Calcular dimensiones respetando aspect ratio ORIGINAL
            const img = await this._loadImage(imgData);
            const imgAspect =
              img && img.width && img.height ? img.width / img.height : 1.5;

            // Decidir si usar ancho completo o mitad
            const isLastOdd = i === photos.length - 1 && col === 0;
            const useFullWidth = isLastOdd || photos.length === 1;

            const photoWidth = useFullWidth ? fullWidth : halfWidth;
            // Calcular altura respetando aspect ratio SIN límite
            let photoHeight = photoWidth / imgAspect;
            // Solo limitar si es extremadamente alta
            photoHeight = Math.min(photoHeight, useFullWidth ? 120 : 90);

            // Verificar espacio
            if (rowY + photoHeight > pageHeight - 45) {
              doc.addPage();
              rowY = margin;
              col = 0;
              rowHeights = [0, 0];
            }

            const photoX = useFullWidth
              ? margin
              : margin + col * (halfWidth + photoGap);

            // Usar máxima calidad (SLOW en lugar de FAST)
            doc.addImage(
              imgData,
              "JPEG",
              photoX,
              rowY,
              photoWidth,
              photoHeight,
              undefined,
              "SLOW", // Máxima calidad
            );

            if (useFullWidth) {
              rowY += photoHeight + photoGap;
              col = 0;
              rowHeights = [0, 0];
            } else {
              rowHeights[col] = photoHeight;
              col++;

              if (col >= 2) {
                col = 0;
                rowY += Math.max(rowHeights[0], rowHeights[1]) + photoGap;
                rowHeights = [0, 0];
              }
            }
          }
        } catch (err) {
          console.warn("Error cargando foto:", err);
        }
      }

      // Ajustar posición final si quedó una foto suelta
      if (col > 0) {
        rowY += rowHeights[0] + photoGap;
      }
      yPosition = rowY + 8;
    }

    // ============================================
    // FOTOS DE ZONAS COMUNES
    // ============================================
    const commonPhotos = [];
    for (const room of commonRooms) {
      if (room.photos && room.photos.length > 0) {
        for (const photo of room.photos) {
          commonPhotos.push(
            typeof photo === "string" ? photo : photo.url || photo,
          );
        }
      }
    }

    if (commonPhotos.length > 0) {
      // Verificar espacio
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      this._drawSectionTitle(doc, "Zonas comunes", margin, yPosition);
      yPosition += 8;

      const photoGap = 6;
      const fullWidth = pageWidth - 2 * margin;
      const halfWidth = (fullWidth - photoGap) / 2;

      let col = 0;
      let rowY = yPosition;
      let rowHeights = [0, 0];

      for (let i = 0; i < commonPhotos.length; i++) {
        try {
          const photoUrl = commonPhotos[i];
          const imgData = await this.loadImageAsBase64(photoUrl);

          if (imgData) {
            // Calcular dimensiones respetando aspect ratio ORIGINAL
            const img = await this._loadImage(imgData);
            const imgAspect =
              img && img.width && img.height ? img.width / img.height : 1.5;

            // Decidir si usar ancho completo o mitad
            const isLastOdd = i === commonPhotos.length - 1 && col === 0;
            const useFullWidth = isLastOdd || commonPhotos.length === 1;

            const photoWidth = useFullWidth ? fullWidth : halfWidth;
            let photoHeight = photoWidth / imgAspect;
            photoHeight = Math.min(photoHeight, useFullWidth ? 120 : 90);

            // Verificar espacio
            if (rowY + photoHeight > pageHeight - 45) {
              doc.addPage();
              rowY = margin;
              col = 0;
              rowHeights = [0, 0];
            }

            const photoX = useFullWidth
              ? margin
              : margin + col * (halfWidth + photoGap);

            // Usar máxima calidad
            doc.addImage(
              imgData,
              "JPEG",
              photoX,
              rowY,
              photoWidth,
              photoHeight,
              undefined,
              "SLOW",
            );

            if (useFullWidth) {
              rowY += photoHeight + photoGap;
              col = 0;
              rowHeights = [0, 0];
            } else {
              rowHeights[col] = photoHeight;
              col++;

              if (col >= 2) {
                col = 0;
                rowY += Math.max(rowHeights[0], rowHeights[1]) + photoGap;
                rowHeights = [0, 0];
              }
            }
          }
        } catch (err) {
          console.warn("Error cargando foto de zona común:", err);
        }
      }

      // Ajustar posición final si quedó una foto suelta
      if (col > 0) {
        rowY += rowHeights[0] + photoGap;
      }
      yPosition = rowY;
    }

    // ============================================
    // FOOTER EN LA PARTE INFERIOR
    // ============================================
    const footerY = pageHeight - 25; // Posición fija en la parte inferior

    // Línea separadora
    doc.setDrawColor(...this.colors.slate);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

    // Información de contacto CENTRADA
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.slate);
    doc.text("CONTACTO", pageWidth / 2, footerY, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    const contactText = ownerContact || "WhatsApp preferiblemente";
    doc.text(contactText, pageWidth / 2, footerY + 10, { align: "center" });

    // ============================================
    // GUARDAR Y RETORNAR
    // ============================================
    const locationShort = propertyAddress
      ? propertyAddress.split(",")[0].trim().replace(/\s+/g, "_")
      : "Habitacion";
    const fileName = `Anuncio_${locationShort}_${Date.now()}.pdf`;

    doc.save(fileName);

    // Intentar abrir en nueva pestaña
    try {
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (e) {
      console.warn("No se pudo abrir el PDF en nueva pestaña", e);
    }

    return doc;
  },

  /**
   * Genera un PDF de contrato de alquiler profesional
   */
  async generateContract(contractData) {
    const {
      tenantName,
      tenantDni,
      tenantEmail,
      tenantPhone,
      propertyName,
      propertyAddress,
      roomName,
      monthlyRent,
      depositAmount,
      startDate,
      endDate,
      contractMonths,
      contractNotes,
      ownerName = "Propietario",
      ownerDni = "",
    } = contractData;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Helper para añadir texto con formato
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 11,
        fontStyle = "normal",
        maxWidth = pageWidth - 2 * margin,
        color = this.colors.charcoal,
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.4) + 2;
    };

    // ============================================
    // HEADER ELEGANTE
    // ============================================
    doc.setFillColor(...this.colors.navy);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Línea dorada
    doc.setFillColor(...this.colors.gold);
    doc.rect(0, 45, pageWidth, 3, "F");

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text("CONTRATO DE ALQUILER", pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.pearl);
    doc.text("DE HABITACIÓN", pageWidth / 2, 35, { align: "center" });

    yPosition = 60;

    // Fecha del documento
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...this.colors.stone);
    doc.text(`Documento generado el ${today}`, pageWidth - margin, yPosition, {
      align: "right",
    });
    yPosition += 15;

    // ============================================
    // SECCIÓN: PARTES
    // ============================================
    this._drawContractSectionHeader(
      doc,
      "PARTES INTERVINIENTES",
      margin,
      yPosition,
      pageWidth,
    );
    yPosition += 14;

    const cardWidth = (pageWidth - 2 * margin - 12) / 2;
    const cardHeight = 40;

    // Card Arrendador
    this._drawPartyCard(doc, margin, yPosition, cardWidth, cardHeight, {
      role: "EL ARRENDADOR",
      name: ownerName,
      dni: ownerDni,
      color: this.colors.navy,
    });

    // Card Arrendatario
    this._drawPartyCard(
      doc,
      margin + cardWidth + 12,
      yPosition,
      cardWidth,
      cardHeight,
      {
        role: "EL ARRENDATARIO",
        name: tenantName,
        dni: tenantDni,
        color: this.colors.gold,
      },
    );

    yPosition += cardHeight + 18;

    // ============================================
    // SECCIÓN: OBJETO
    // ============================================
    this._drawContractSectionHeader(
      doc,
      "OBJETO DEL CONTRATO",
      margin,
      yPosition,
      pageWidth,
    );
    yPosition += 12;

    const objectText = `Se cede en alquiler la habitación "${roomName}" ubicada en la propiedad "${propertyName}", situada en ${propertyAddress}, incluyendo el uso compartido de las zonas comunes de la vivienda.`;
    yPosition += addText(objectText, margin, yPosition, { fontSize: 10 });
    yPosition += 10;

    // ============================================
    // SECCIÓN: CONDICIONES ECONÓMICAS
    // ============================================
    this._drawContractSectionHeader(
      doc,
      "CONDICIONES ECONÓMICAS",
      margin,
      yPosition,
      pageWidth,
    );
    yPosition += 12;

    const boxWidth = (pageWidth - 2 * margin - 20) / 3;
    const boxHeight = 45;

    // Box Duración
    this._drawContractInfoBox(doc, margin, yPosition, boxWidth, boxHeight, {
      label: "DURACIÓN",
      value: `${contractMonths || 12} meses`,
      subtext: `${new Date(startDate).toLocaleDateString("es-ES")} - ${new Date(
        endDate,
      ).toLocaleDateString("es-ES")}`,
      color: this.colors.navy,
    });

    // Box Renta
    this._drawContractInfoBox(
      doc,
      margin + boxWidth + 10,
      yPosition,
      boxWidth,
      boxHeight,
      {
        label: "RENTA MENSUAL",
        value: `${parseFloat(monthlyRent).toFixed(0)}€`,
        subtext: "Pago: primeros 5 días",
        color: this.colors.emerald,
      },
    );

    // Box Fianza
    this._drawContractInfoBox(
      doc,
      margin + 2 * (boxWidth + 10),
      yPosition,
      boxWidth,
      boxHeight,
      {
        label: "FIANZA",
        value: depositAmount
          ? `${parseFloat(depositAmount).toFixed(0)}€`
          : "1 mes",
        subtext: "Reembolsable",
        color: this.colors.gold,
      },
    );

    yPosition += boxHeight + 18;

    // Verificar espacio
    if (yPosition > 195) {
      doc.addPage();
      yPosition = margin;
    }

    // ============================================
    // SECCIÓN: OBLIGACIONES
    // ============================================
    this._drawContractSectionHeader(
      doc,
      "OBLIGACIONES DEL ARRENDATARIO",
      margin,
      yPosition,
      pageWidth,
    );
    yPosition += 12;

    const obligations = [
      "Hacer uso adecuado de la habitación y zonas comunes de la vivienda.",
      "No realizar modificaciones estructurales sin autorización escrita del arrendador.",
      "Mantener la habitación en buen estado de conservación e higiene.",
      "Respetar las normas de convivencia con otros inquilinos de la vivienda.",
      "No subarrendar ni ceder el uso de la habitación a terceros.",
      "Comunicar al arrendador cualquier desperfecto o avería.",
    ];

    obligations.forEach((obligation) => {
      doc.setFillColor(...this.colors.navy);
      doc.circle(margin + 3, yPosition - 1, 1.5, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.charcoal);

      const lines = doc.splitTextToSize(
        obligation,
        pageWidth - 2 * margin - 15,
      );
      doc.text(lines, margin + 10, yPosition);
      yPosition += lines.length * 4 + 4;
    });

    // Notas adicionales
    if (contractNotes) {
      yPosition += 8;
      this._drawContractSectionHeader(
        doc,
        "CONDICIONES PARTICULARES",
        margin,
        yPosition,
        pageWidth,
      );
      yPosition += 12;
      yPosition += addText(contractNotes, margin, yPosition, { fontSize: 10 });
    }

    // ============================================
    // FIRMAS
    // ============================================
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = pageHeight - 75;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.stone);
    doc.text(
      "En prueba de conformidad, ambas partes firman el presente contrato:",
      margin,
      yPosition,
    );
    yPosition += 15;

    // Firma Arrendador
    doc.setDrawColor(...this.colors.slate);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 25, margin + 75, yPosition + 25);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.navy);
    doc.text("EL ARRENDADOR", margin, yPosition + 35);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.slate);
    doc.text(ownerName, margin, yPosition + 43);

    // Firma Arrendatario
    doc.line(
      pageWidth - margin - 75,
      yPosition + 25,
      pageWidth - margin,
      yPosition + 25,
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.gold);
    doc.text("EL ARRENDATARIO", pageWidth - margin - 75, yPosition + 35);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.slate);
    doc.text(tenantName, pageWidth - margin - 75, yPosition + 43);

    // ============================================
    // FOOTER
    // ============================================
    doc.setFillColor(...this.colors.pearl);
    doc.rect(0, pageHeight - 14, pageWidth, 14, "F");

    doc.setFontSize(7);
    doc.setTextColor(...this.colors.stone);
    doc.text(
      `Contrato de arrendamiento de habitación · ${propertyAddress}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" },
    );

    // Guardar
    // Guardar
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `Contrato_Habitación_${tenantName.replace(
      /\s+/g,
      "_",
    )}_${dateStr}.pdf`;
    doc.save(fileName);
    return doc;
  },

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  _drawGradientOverlay(doc, x, y, width, height) {
    // Simular gradiente con rectángulos de opacidad creciente
    const steps = 10;
    const stepHeight = height / steps;

    for (let i = 0; i < steps; i++) {
      const opacity = (i / steps) * 0.8;
      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity }));
      doc.rect(x, y + i * stepHeight, width, stepHeight + 1, "F");
    }
    doc.setGState(new doc.GState({ opacity: 1 }));
  },

  _drawSectionTitle(doc, text, x, y) {
    // Título
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    doc.text(text, x, y);

    // Línea decorativa justo debajo del título
    doc.setFillColor(...this.colors.gold);
    doc.rect(x, y + 2, 35, 2.5, "F");
  },

  _drawPremiumInfoBox(
    doc,
    x,
    y,
    width,
    height,
    { label, value, subtext, accentColor, icon },
  ) {
    // Fondo
    doc.setFillColor(...this.colors.pearl);
    doc.roundedRect(x, y, width, height, 4, 4, "F");

    // Línea de acento superior
    doc.setFillColor(...accentColor);
    doc.roundedRect(x, y, width, 3, 4, 4, "F");
    doc.rect(x, y + 2, width, 2, "F"); // Rectificar esquinas inferiores

    // Label - centrado manual
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.stone);
    const labelWidth = doc.getTextWidth(label);
    const labelX = x + (width - labelWidth) / 2;
    doc.text(label, labelX, y + 13);

    // Valor principal - centrado manual
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    const valueWidth = doc.getTextWidth(value);
    const valueX = x + (width - valueWidth) / 2;
    doc.text(value, valueX, y + 27);

    // Subtexto - centrado manual
    if (subtext) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.slate);
      const subtextWidth = doc.getTextWidth(subtext);
      const subtextX = x + (width - subtextWidth) / 2;
      doc.text(subtext, subtextX, y + 37);
    }
  },

  _drawContractSectionHeader(doc, text, x, y, pageWidth) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.navy);
    doc.text(text, x, y);

    const textWidth = doc.getTextWidth(text);

    // Línea dorada bajo el texto
    doc.setFillColor(...this.colors.gold);
    doc.rect(x, y + 2, textWidth, 1.5, "F");

    // Línea gris extendida
    doc.setFillColor(...this.colors.pearl);
    doc.rect(
      x + textWidth + 5,
      y + 2,
      pageWidth - margin * 2 - textWidth - 5,
      0.5,
      "F",
    );
  },

  _drawPartyCard(doc, x, y, width, height, { role, name, dni, color }) {
    // Fondo
    doc.setFillColor(...this.colors.pearl);
    doc.roundedRect(x, y, width, height, 4, 4, "F");

    // Línea lateral de color
    doc.setFillColor(...color);
    doc.roundedRect(x, y, 4, height, 4, 4, "F");
    doc.rect(x + 2, y, 2, height, "F");

    // Rol
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(role, x + 12, y + 12);

    // Nombre
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    doc.text(name, x + 12, y + 24);

    // DNI
    if (dni) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.slate);
      doc.text(`DNI: ${dni}`, x + 12, y + 34);
    }
  },

  _drawContractInfoBox(
    doc,
    x,
    y,
    width,
    height,
    { label, value, subtext, color },
  ) {
    // Fondo
    doc.setFillColor(...this.colors.pearl);
    doc.roundedRect(x, y, width, height, 4, 4, "F");

    // Línea superior de color
    doc.setFillColor(...color);
    doc.roundedRect(x, y, width, 4, 4, 4, "F");
    doc.rect(x, y + 2, width, 2, "F");

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(label, x + 8, y + 15);

    // Valor
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.charcoal);
    doc.text(value, x + 8, y + 28);

    // Subtexto
    if (subtext) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.slate);
      const lines = doc.splitTextToSize(subtext, width - 16);
      doc.text(lines[0], x + 8, y + 38);
    }
  },

  async _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  async loadImageAsBase64(url) {
    try {
      if (!url) return null;
      if (url.startsWith("data:")) return url;

      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) return null;

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Error loading image:", error);
      return null;
    }
  },
};
