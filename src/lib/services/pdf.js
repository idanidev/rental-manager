import jsPDF from "jspdf";

/**
 * Servicio profesional para generar PDFs de contratos y anuncios
 * Diseño moderno estilo inmobiliaria premium
 */
export const pdfService = {
  // Paleta de colores profesional
  colors: {
    primary: [37, 99, 235], // Azul
    secondary: [99, 102, 241], // Indigo
    accent: [16, 185, 129], // Verde esmeralda
    dark: [17, 24, 39], // Casi negro
    gray: [107, 114, 128], // Gris medio
    lightGray: [243, 244, 246], // Gris muy claro
    white: [255, 255, 255],
    orange: [249, 115, 22], // Naranja para destacar
  },

  /**
   * Genera un PDF de anuncio profesional tipo inmobiliaria premium
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
    } = roomData;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = 0;

    // ============================================
    // PÁGINA 1: Header (Título + Precio + Ubicación)
    // ============================================
    const headerHeight = 45;

    // Fondo del header
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Patrón decorativo sutil en header
    doc.setFillColor(255, 255, 255);
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    for (let i = 0; i < 5; i++) {
      doc.circle(pageWidth - 20 - i * 25, 15 + i * 5, 30, "F");
    }
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Título principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);

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
    doc.text(titleText, margin, 20);

    // Ubicación bajo el título
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const locationShort = propertyAddress ? propertyAddress.split(",")[0] : "";
    doc.text(locationShort, margin, 32);

    // Badge de precio
    const priceBoxWidth = 60;
    const priceBoxHeight = 28;
    const priceBoxX = pageWidth - margin - priceBoxWidth;
    const priceBoxY = (headerHeight - priceBoxHeight) / 2;

    doc.setFillColor(...this.colors.accent);
    doc.roundedRect(
      priceBoxX,
      priceBoxY,
      priceBoxWidth,
      priceBoxHeight,
      4,
      4,
      "F"
    );

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    const priceText = `${parseFloat(monthlyRent || 0).toFixed(0)}\u20AC`;
    doc.text(priceText, priceBoxX + priceBoxWidth / 2, priceBoxY + 12, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("/mes", priceBoxX + priceBoxWidth / 2, priceBoxY + 20, {
      align: "center",
    });

    yPosition = headerHeight + 15;

    // ============================================
    // Galería de fotos (Incluyendo foto principal)
    // ============================================

    // Usar TODAS las fotos disponibles
    const allPhotos = [...photos];

    if (allPhotos.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Galería", margin, yPosition);
      yPosition += 8;

      const photoGap = 4;
      const availableWidth = pageWidth - 2 * margin;
      const cols = 2;
      const photoWidth = (availableWidth - photoGap) / cols;
      const defaultPhotoHeight = 55;

      let col = 0;
      let rowY = yPosition;

      for (let i = 0; i < allPhotos.length; i++) {
        try {
          const photoUrl =
            typeof allPhotos[i] === "string"
              ? allPhotos[i]
              : allPhotos[i].url || allPhotos[i];
          const imgData = await this.loadImageAsBase64(photoUrl);

          if (imgData) {
            let finalHeight = defaultPhotoHeight;

            // Intentar calcular aspect ratio nativo
            try {
              const img = await this._loadImage(imgData);
              if (img && img.width && img.height) {
                const imgAspect = img.width / img.height;
                const calculatedHeight = photoWidth / imgAspect;
                const maxHeight = 80; // Un poco más alto permitido
                finalHeight = Math.min(calculatedHeight, maxHeight);
              }
            } catch (imgErr) {
              console.warn("Using default height for image:", imgErr);
            }

            // Verificar espacio en página
            if (rowY + finalHeight > pageHeight - 30) {
              // Dejar margen abajo
              doc.addPage();
              rowY = margin;
              col = 0;
            }

            const photoX = margin + col * (photoWidth + photoGap);

            doc.addImage(
              imgData,
              "JPEG",
              photoX,
              rowY,
              photoWidth,
              finalHeight,
              undefined,
              "FAST"
            );

            // Borde sutil
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.roundedRect(photoX, rowY, photoWidth, finalHeight, 2, 2, "S");

            col++;
            if (col >= cols) {
              col = 0;
              rowY += finalHeight + photoGap;
            }
          }
        } catch (err) {
          console.warn("Error loading gallery photo:", err);
        }
      }

      // Ajustar yPosition al final de la galería
      if (col > 0) rowY += defaultPhotoHeight + photoGap;
      yPosition = rowY + 10;
    }

    // ============================================
    // Badges de características
    // ============================================
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    const features = [];
    if (sizeSqm) features.push({ text: `${sizeSqm} m²` });

    // Detectar características de zonas comunes
    const hasPool = commonRooms.some((r) =>
      r.name?.toLowerCase().includes("piscina")
    );
    const hasGarden = commonRooms.some(
      (r) =>
        r.name?.toLowerCase().includes("jardin") ||
        r.name?.toLowerCase().includes("jardín")
    );
    const hasParking = commonRooms.some(
      (r) =>
        r.name?.toLowerCase().includes("parking") ||
        r.name?.toLowerCase().includes("garaje")
    );
    const hasTerrace = commonRooms.some((r) =>
      r.name?.toLowerCase().includes("terraza")
    );

    if (hasPool) features.push({ text: "Piscina" });
    if (hasGarden) features.push({ text: "Jardín" });
    if (hasTerrace) features.push({ text: "Terraza" });
    if (hasParking) features.push({ text: "Parking" });
    features.push({ text: "WiFi" });

    if (features.length > 0) {
      let featureX = margin;
      const badgeHeight = 16;
      const badgePadding = 10;

      features.forEach((feat, idx) => {
        if (featureX < pageWidth - 50) {
          // Evitar salir del margen
          doc.setFontSize(9);
          const textWidth = doc.getTextWidth(feat.text);
          const badgeWidth = textWidth + badgePadding * 2;

          // Badge con borde
          doc.setFillColor(...this.colors.lightGray);
          doc.roundedRect(
            featureX,
            yPosition,
            badgeWidth,
            badgeHeight,
            8,
            8,
            "F"
          );

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...this.colors.dark);
          doc.text(feat.text, featureX + badgePadding, yPosition + 11);

          featureX += badgeWidth + 6;
        }
      });
      yPosition += badgeHeight + 12;
    }

    // ============================================
    // Descripción
    // ============================================
    if (description && description.trim()) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Sobre la habitación", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.gray);
      const descLines = doc.splitTextToSize(
        description,
        pageWidth - 2 * margin
      );
      // Mostrar más líneas si hay espacio
      const maxLines = 10;
      doc.text(descLines.slice(0, maxLines), margin, yPosition);
      yPosition += Math.min(descLines.length, maxLines) * 5 + 8;
    }

    // ============================================
    // Zonas comunes - TODAS LAS FOTOS EN RESOLUCIÓN NATIVA
    // ============================================
    if (commonRooms.length > 0) {
      // Verificar espacio, si no hay suficiente ir a página 2
      if (yPosition > pageHeight - 90) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Zonas comunes", margin, yPosition);
      yPosition += 8;

      const roomsWithPhotos = commonRooms.filter(
        (r) => r.photos && r.photos.length > 0
      );

      if (roomsWithPhotos.length > 0) {
        const commonGap = 6;
        const commonWidth = (pageWidth - 2 * margin - commonGap) / 2;
        const cols = 2;
        const defaultCommonHeight = 55; // Altura por defecto

        let commonCol = 0;

        // Iterar por TODAS las zonas comunes (sin límite)
        for (const room of roomsWithPhotos) {
          // Mostrar TODAS las fotos de cada zona común (igual que la galería)
          for (
            let photoIndex = 0;
            photoIndex < room.photos.length;
            photoIndex++
          ) {
            try {
              const photoUrl =
                typeof room.photos[photoIndex] === "string"
                  ? room.photos[photoIndex]
                  : room.photos[photoIndex].url || room.photos[photoIndex];
              const imgData = await this.loadImageAsBase64(photoUrl);

              if (imgData) {
                let commonHeight = defaultCommonHeight;

                // Intentar calcular aspect ratio nativo
                try {
                  const img = await this._loadImage(imgData);
                  if (img && img.width && img.height) {
                    const imgAspect = img.width / img.height;
                    const calculatedHeight = commonWidth / imgAspect;
                    const maxHeight = 65;
                    commonHeight = Math.min(calculatedHeight, maxHeight);
                  }
                } catch (imgErr) {
                  console.warn(
                    "Using default height for common room image:",
                    imgErr
                  );
                }

                // Verificar espacio
                if (yPosition + commonHeight > pageHeight - 70) {
                  doc.addPage();
                  yPosition = margin;
                  commonCol = 0;
                }

                const photoX = margin + commonCol * (commonWidth + commonGap);

                doc.addImage(
                  imgData,
                  "JPEG",
                  photoX,
                  yPosition,
                  commonWidth,
                  commonHeight,
                  undefined,
                  "FAST"
                );

                // Etiqueta con nombre sobre la foto (solo en la primera foto de cada zona)
                if (photoIndex === 0) {
                  const labelHeight = 18;
                  doc.setFillColor(0, 0, 0);
                  doc.setGState(new doc.GState({ opacity: 0.65 }));
                  doc.rect(
                    photoX,
                    yPosition + commonHeight - labelHeight,
                    commonWidth,
                    labelHeight,
                    "F"
                  );
                  doc.setGState(new doc.GState({ opacity: 1 }));

                  doc.setFontSize(10);
                  doc.setFont("helvetica", "bold");
                  doc.setTextColor(...this.colors.white);
                  doc.text(
                    room.name || "Zona común",
                    photoX + 6,
                    yPosition + commonHeight - 6
                  );
                }

                commonCol++;
                if (commonCol >= cols) {
                  commonCol = 0;
                  yPosition += commonHeight + commonGap;
                }
              }
            } catch (err) {
              console.warn("Error loading common room photo:", err);
            }
          }
        }

        if (commonCol > 0) {
          yPosition += defaultCommonHeight + commonGap;
        }
      } else {
        // Lista simple si no hay fotos
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...this.colors.gray);
        const roomNames = commonRooms
          .map((r) => r.name)
          .filter(Boolean)
          .join("  |  ");
        doc.text(roomNames, margin, yPosition);
        yPosition += 8;
      }

      yPosition += 8;
    }

    // ============================================
    // Box de información - COMPACTO
    // ============================================
    // Asegurar que está en la parte inferior o en nueva página
    const infoBoxHeight = 50;
    if (yPosition > pageHeight - infoBoxHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Fondo del box
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(
      margin,
      yPosition,
      pageWidth - 2 * margin,
      infoBoxHeight,
      4,
      4,
      "F"
    );

    // Línea decorativa superior
    doc.setFillColor(...this.colors.primary);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 3, "F");

    const infoY = yPosition + 15;
    const colWidth = (pageWidth - 2 * margin) / 3;

    // Columna 1: Alquiler
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.gray);
    doc.text("ALQUILER MENSUAL", margin + 10, infoY);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(
      `${parseFloat(monthlyRent || 0).toFixed(0)}\u20AC`,
      margin + 10,
      infoY + 12
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(expenses || "+ gastos", margin + 10, infoY + 22);

    // Columna 2: Depósito
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DEPOSITO", margin + colWidth + 10, infoY);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.secondary);
    doc.text(
      depositAmount ? `${parseFloat(depositAmount).toFixed(0)}\u20AC` : "1 mes",
      margin + colWidth + 10,
      infoY + 12
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text("Reembolsable", margin + colWidth + 10, infoY + 22);

    // Columna 3: Estancia
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ESTANCIA MINIMA", margin + 2 * colWidth + 10, infoY);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.accent);
    doc.text("6 meses", margin + 2 * colWidth + 10, infoY + 12);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text("Disponible ahora", margin + 2 * colWidth + 10, infoY + 22);

    yPosition += infoBoxHeight + 12;

    // ============================================
    // Ubicación
    // ============================================
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("Ubicacion", margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    if (propertyAddress) {
      doc.text(propertyAddress, margin, yPosition);
    }

    // ============================================
    // Footer de contacto - Línea fina + contacto
    // ============================================
    const footerY = pageHeight - 20;

    // Línea separadora fina
    doc.setDrawColor(...this.colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    // Texto de contacto
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text("Contacto:", margin, footerY + 10);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    const contactText = ownerContact || "WhatsApp preferiblemente";
    doc.text(contactText, pageWidth - margin, footerY + 10, { align: "right" });

    // Guardar
    const fileName = `Anuncio_${
      locationShort.replace(/\s+/g, "_") || "Habitacion"
    }_${Date.now()}.pdf`;

    doc.save(fileName);

    // Intentar abrir en nueva pestaña (especialmente útil para Android)
    try {
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (e) {
      console.warn("No se pudo abrir el PDF en una nueva pestaña", e);
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
        color = this.colors.dark,
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.4) + 2;
    };

    // Header
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text("CONTRATO DE ALQUILER", pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("DE HABITACION", pageWidth / 2, 30, { align: "center" });

    yPosition = 55;

    // Fecha
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...this.colors.gray);
    doc.text(`Documento generado el ${today}`, pageWidth - margin, yPosition, {
      align: "right",
    });
    yPosition += 12;

    // Sección PARTES
    this._drawSectionHeader(
      doc,
      "PARTES INTERVINIENTES",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 12;

    // Card Arrendador
    const cardWidth = (pageWidth - 2 * margin - 10) / 2;
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(margin, yPosition, cardWidth, 32, 3, 3, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text("EL ARRENDADOR", margin + 5, yPosition + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    doc.text(ownerName, margin + 5, yPosition + 18);
    if (ownerDni) {
      doc.setFontSize(9);
      doc.setTextColor(...this.colors.gray);
      doc.text(`DNI: ${ownerDni}`, margin + 5, yPosition + 26);
    }

    // Card Arrendatario
    const cardX = margin + cardWidth + 10;
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(cardX, yPosition, cardWidth, 32, 3, 3, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.secondary);
    doc.text("EL ARRENDATARIO", cardX + 5, yPosition + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    doc.text(tenantName, cardX + 5, yPosition + 18);
    if (tenantDni) {
      doc.setFontSize(9);
      doc.setTextColor(...this.colors.gray);
      doc.text(`DNI: ${tenantDni}`, cardX + 5, yPosition + 26);
    }

    yPosition += 45;

    // Sección OBJETO
    this._drawSectionHeader(
      doc,
      "OBJETO DEL CONTRATO",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 10;

    const objectText = `Se cede en alquiler la habitacion "${roomName}" ubicada en la propiedad "${propertyName}", situada en ${propertyAddress}, incluyendo el uso compartido de las zonas comunes de la vivienda.`;
    yPosition += addText(objectText, margin, yPosition);
    yPosition += 8;

    // Sección CONDICIONES
    this._drawSectionHeader(doc, "CONDICIONES", margin, yPosition, pageWidth);
    yPosition += 10;

    const boxWidth = (pageWidth - 2 * margin - 16) / 3;
    const boxHeight = 38;

    // Box Duración
    this._drawInfoBox(doc, margin, yPosition, boxWidth, boxHeight, {
      label: "DURACION",
      value: `${contractMonths || 12} meses`,
      subtext: `${new Date(startDate).toLocaleDateString("es-ES")} - ${new Date(
        endDate
      ).toLocaleDateString("es-ES")}`,
      color: this.colors.primary,
    });

    // Box Renta
    this._drawInfoBox(
      doc,
      margin + boxWidth + 8,
      yPosition,
      boxWidth,
      boxHeight,
      {
        label: "RENTA MENSUAL",
        value: `${parseFloat(monthlyRent).toFixed(0)}\u20AC`,
        subtext: "Primeros 5 dias del mes",
        color: this.colors.accent,
      }
    );

    // Box Fianza
    this._drawInfoBox(
      doc,
      margin + 2 * (boxWidth + 8),
      yPosition,
      boxWidth,
      boxHeight,
      {
        label: "FIANZA",
        value: depositAmount
          ? `${parseFloat(depositAmount).toFixed(0)}\u20AC`
          : "1 mes",
        subtext: "Reembolsable",
        color: this.colors.secondary,
      }
    );

    yPosition += boxHeight + 15;

    // Verificar espacio
    if (yPosition > 190) {
      doc.addPage();
      yPosition = margin;
    }

    // Sección OBLIGACIONES
    this._drawSectionHeader(
      doc,
      "OBLIGACIONES DEL ARRENDATARIO",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 10;

    const obligations = [
      "Hacer uso adecuado de la habitacion y zonas comunes.",
      "No realizar modificaciones sin autorizacion escrita.",
      "Mantener la habitacion en buen estado de conservacion.",
      "Respetar la convivencia con otros inquilinos.",
      "No subarrendar la habitacion sin autorizacion.",
    ];

    obligations.forEach((obligation) => {
      doc.setFillColor(...this.colors.primary);
      doc.circle(margin + 3, yPosition - 1.5, 1.5, "F");
      yPosition += addText(obligation, margin + 10, yPosition, {
        fontSize: 10,
      });
      yPosition += 1;
    });

    // Notas adicionales
    if (contractNotes) {
      yPosition += 5;
      this._drawSectionHeader(
        doc,
        "NOTAS ADICIONALES",
        margin,
        yPosition,
        pageWidth
      );
      yPosition += 10;
      yPosition += addText(contractNotes, margin, yPosition, { fontSize: 10 });
    }

    // Firmas
    if (yPosition > pageHeight - 70) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = pageHeight - 65;

    doc.setDrawColor(...this.colors.gray);
    doc.setLineWidth(0.5);

    // Firma Arrendador
    doc.line(margin, yPosition + 20, margin + 70, yPosition + 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("EL ARRENDADOR", margin, yPosition + 30);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(ownerName, margin, yPosition + 38);

    // Firma Arrendatario
    doc.line(
      pageWidth - margin - 70,
      yPosition + 20,
      pageWidth - margin,
      yPosition + 20
    );
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("EL ARRENDATARIO", pageWidth - margin - 70, yPosition + 30);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(tenantName, pageWidth - margin - 70, yPosition + 38);

    // Footer
    doc.setFillColor(...this.colors.lightGray);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(...this.colors.gray);
    doc.text(
      `Contrato generado digitalmente - ${propertyAddress}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );

    // Guardar
    const fileName = `Contrato_${roomName}_${tenantName.replace(
      /\s+/g,
      "_"
    )}_${Date.now()}.pdf`;
    doc.save(fileName);
    return doc;
  },

  // ============================================
  // Helpers
  // ============================================

  _drawSectionHeader(doc, text, x, y, pageWidth) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(text, x, y);

    const textWidth = doc.getTextWidth(text);
    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(1.5);
    doc.line(x, y + 2, x + textWidth, y + 2);

    doc.setDrawColor(...this.colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(x + textWidth + 5, y + 2, pageWidth - 20, y + 2);
  },

  _drawInfoBox(doc, x, y, width, height, { label, value, subtext, color }) {
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(x, y, width, height, 3, 3, "F");

    doc.setFillColor(...color);
    doc.rect(x, y, 3, height, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(label, x + 8, y + 9);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text(value, x + 8, y + 20);

    if (subtext) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.gray);
      const lines = doc.splitTextToSize(subtext, width - 12);
      doc.text(lines[0], x + 8, y + 30);
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

  numberToWords(num) {
    const ones = [
      "",
      "uno",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
    ];
    const tens = [
      "",
      "",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
    ];
    const hundreds = [
      "",
      "ciento",
      "doscientos",
      "trescientos",
      "cuatrocientos",
      "quinientos",
      "seiscientos",
      "setecientos",
      "ochocientos",
      "novecientos",
    ];

    if (num === 0) return "cero";
    if (num < 10) return ones[num];
    if (num < 20) {
      const specials = [
        "diez",
        "once",
        "doce",
        "trece",
        "catorce",
        "quince",
        "dieciseis",
        "diecisiete",
        "dieciocho",
        "diecinueve",
      ];
      return specials[num - 10];
    }
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? " y " + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return (
        hundreds[hundred] +
        (remainder > 0 ? " " + this.numberToWords(remainder) : "")
      );
    }
    return num.toString();
  },
};
