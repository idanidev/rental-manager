// jsPDF se carga dinámicamente para optimizar el bundle inicial
// import jsPDF from "jspdf";

/**
 * Carga jsPDF de manera lazy (solo cuando se necesita)
 * @returns {Promise<typeof import('jspdf').default>}
 */
async function loadJsPDF() {
  const { default: jsPDF } = await import("jspdf");
  return jsPDF;
}

/**
 * Servicio profesional para generar PDFs de contratos y anuncios
 * con diseño moderno y atractivo
 */
export const pdfService = {
  // Paleta de colores profesional
  colors: {
    primary: [41, 98, 255], // Azul vibrante
    secondary: [99, 102, 241], // Indigo
    accent: [16, 185, 129], // Verde esmeralda
    dark: [17, 24, 39], // Casi negro
    gray: [107, 114, 128], // Gris medio
    lightGray: [243, 244, 246], // Gris muy claro
    white: [255, 255, 255],
    success: [34, 197, 94],
    warning: [251, 191, 36],
  },

  // Fuentes y tamaños
  fonts: {
    title: 28,
    subtitle: 18,
    heading: 14,
    body: 11,
    small: 9,
    tiny: 8,
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

    const jsPDF = await loadJsPDF();
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
        align = "left",
        maxWidth = pageWidth - 2 * margin,
        color = this.colors.dark,
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.4) + 2;
    };

    // Header con diseño moderno
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text("CONTRATO DE ALQUILER", pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("DE HABITACIÓN", pageWidth / 2, 35, { align: "center" });

    yPosition = 60;

    // Fecha del contrato
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...this.colors.gray);
    doc.text(`Documento generado el ${today}`, pageWidth - margin, yPosition, {
      align: "right",
    });
    yPosition += 15;

    // Sección: PARTES
    this._drawSectionHeader(
      doc,
      "PARTES INTERVINIENTES",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 15;

    // Card Arrendador
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(
      margin,
      yPosition,
      (pageWidth - 2 * margin - 10) / 2,
      35,
      3,
      3,
      "F"
    );

    doc.setFontSize(9);
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
    const cardX = margin + (pageWidth - 2 * margin - 10) / 2 + 10;
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(
      cardX,
      yPosition,
      (pageWidth - 2 * margin - 10) / 2,
      35,
      3,
      3,
      "F"
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.secondary);
    doc.text("EL ARRENDATARIO", cardX + 5, yPosition + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    doc.text(tenantName, cardX + 5, yPosition + 18);

    let tenantInfo = [];
    if (tenantDni) tenantInfo.push(`DNI: ${tenantDni}`);
    if (tenantInfo.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(...this.colors.gray);
      doc.text(tenantInfo.join(" | "), cardX + 5, yPosition + 26);
    }

    yPosition += 50;

    // Sección: OBJETO
    this._drawSectionHeader(
      doc,
      "OBJETO DEL CONTRATO",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.dark);
    const objectText = `Se cede en alquiler la habitación "${roomName}" ubicada en la propiedad "${propertyName}", situada en ${propertyAddress}, incluyendo el uso compartido de las zonas comunes de la vivienda.`;
    yPosition += addText(objectText, margin, yPosition, {
      maxWidth: pageWidth - 2 * margin,
    });
    yPosition += 10;

    // Sección: CONDICIONES - Grid de info
    this._drawSectionHeader(doc, "CONDICIONES", margin, yPosition, pageWidth);
    yPosition += 12;

    const boxWidth = (pageWidth - 2 * margin - 20) / 3;
    const boxHeight = 40;

    // Box 1: Duración
    this._drawInfoBox(doc, margin, yPosition, boxWidth, boxHeight, {
      icon: "📅",
      label: "DURACIÓN",
      value: `${contractMonths || 12} meses`,
      subtext: `${new Date(startDate).toLocaleDateString("es-ES")} - ${new Date(
        endDate
      ).toLocaleDateString("es-ES")}`,
      color: this.colors.primary,
    });

    // Box 2: Renta
    this._drawInfoBox(
      doc,
      margin + boxWidth + 10,
      yPosition,
      boxWidth,
      boxHeight,
      {
        icon: "💰",
        label: "RENTA MENSUAL",
        value: `${parseFloat(monthlyRent).toFixed(0)}€`,
        subtext: "Pagaderos los primeros 5 días",
        color: this.colors.accent,
      }
    );

    // Box 3: Fianza
    this._drawInfoBox(
      doc,
      margin + 2 * (boxWidth + 10),
      yPosition,
      boxWidth,
      boxHeight,
      {
        icon: "🔒",
        label: "FIANZA",
        value: depositAmount
          ? `${parseFloat(depositAmount).toFixed(0)}€`
          : "1 mes",
        subtext: "Reembolsable al finalizar",
        color: this.colors.secondary,
      }
    );

    yPosition += boxHeight + 15;

    // Verificar espacio
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Sección: OBLIGACIONES
    this._drawSectionHeader(
      doc,
      "OBLIGACIONES DEL ARRENDATARIO",
      margin,
      yPosition,
      pageWidth
    );
    yPosition += 12;

    const obligations = [
      "Hacer uso adecuado de la habitación y zonas comunes.",
      "No realizar modificaciones sin autorización escrita.",
      "Mantener la habitación en buen estado de conservación.",
      "Respetar la convivencia con otros inquilinos.",
      "No subarrendar la habitación sin autorización.",
    ];

    obligations.forEach((obligation, index) => {
      doc.setFillColor(...this.colors.primary);
      doc.circle(margin + 3, yPosition - 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.dark);
      yPosition += addText(obligation, margin + 10, yPosition, {
        maxWidth: pageWidth - 2 * margin - 10,
      });
      yPosition += 2;
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
      yPosition += 12;
      yPosition += addText(contractNotes, margin, yPosition);
    }

    // Firmas
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = pageHeight - 70;

    doc.setDrawColor(...this.colors.gray);
    doc.setLineWidth(0.5);

    // Firma Arrendador
    doc.line(margin, yPosition + 25, margin + 70, yPosition + 25);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("EL ARRENDADOR", margin, yPosition + 35);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(ownerName, margin, yPosition + 42);

    // Firma Arrendatario
    doc.line(
      pageWidth - margin - 70,
      yPosition + 25,
      pageWidth - margin,
      yPosition + 25
    );
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("EL ARRENDATARIO", pageWidth - margin - 70, yPosition + 35);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(tenantName, pageWidth - margin - 70, yPosition + 42);

    // Footer
    doc.setFillColor(...this.colors.lightGray);
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
    doc.setFontSize(8);
    doc.setTextColor(...this.colors.gray);
    doc.text(
      `Contrato generado digitalmente - ${propertyAddress}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );

    // Guardar
    const fileName = `Contrato_${roomName}_${tenantName.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    return doc;
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

    const jsPDF = await loadJsPDF();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    let yPosition = 0;

    // ============================================
    // PÁGINA 1: Hero + Info Principal
    // ============================================

    // Hero image o gradient background
    let heroHeight = 100;
    let hasHeroImage = false;

    if (photos.length > 0) {
      try {
        const mainPhoto =
          typeof photos[0] === "string"
            ? photos[0]
            : photos[0].url || photos[0];
        const imgData = await this.loadImageAsBase64(mainPhoto);

        if (imgData) {
          // Cargar imagen para obtener dimensiones
          const img = await this._loadImage(imgData);
          const imgAspect = img.width / img.height;

          // Calcular dimensiones para cubrir el ancho completo
          let imgWidth = pageWidth;
          let imgHeight = pageWidth / imgAspect;

          // Si es muy alta, recortamos
          if (imgHeight > 120) {
            imgHeight = 120;
          }
          heroHeight = imgHeight;

          // Añadir imagen como hero
          doc.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pageWidth,
            imgHeight,
            undefined,
            "FAST"
          );
          hasHeroImage = true;

          // Overlay gradient oscuro para mejor legibilidad
          doc.setGState(new doc.GState({ opacity: 0.4 }));
          doc.setFillColor(0, 0, 0);
          doc.rect(0, imgHeight - 50, pageWidth, 50, "F");
          doc.setGState(new doc.GState({ opacity: 1 }));
        }
      } catch (err) {
        console.warn("Error loading hero image:", err);
      }
    }

    // Si no hay imagen, crear un header con gradiente
    if (!hasHeroImage) {
      // Simular gradiente con rectángulos
      for (let i = 0; i < 20; i++) {
        const ratio = i / 20;
        const r = Math.round(41 + (99 - 41) * ratio);
        const g = Math.round(98 + (102 - 98) * ratio);
        const b = Math.round(255 + (241 - 255) * ratio);
        doc.setFillColor(r, g, b);
        doc.rect(0, i * 5, pageWidth, 6, "F");
      }
      heroHeight = 100;
    }

    // Badge de precio sobre el hero
    const priceBoxWidth = 70;
    const priceBoxHeight = 35;
    const priceBoxX = pageWidth - margin - priceBoxWidth;
    const priceBoxY = heroHeight - priceBoxHeight - 10;

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

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text(
      `${parseFloat(monthlyRent || 0).toFixed(0)}€`,
      priceBoxX + priceBoxWidth / 2,
      priceBoxY + 15,
      { align: "center" }
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("/mes", priceBoxX + priceBoxWidth / 2, priceBoxY + 25, {
      align: "center",
    });

    // Título sobre el hero
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);

    let titleText = "Habitación en alquiler";
    if (propertyName && propertyName.toLowerCase().includes("chalet")) {
      titleText = "Habitación en chalet";
    }
    doc.text(titleText, margin, heroHeight - 25);

    // Subtítulo con ubicación
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const locationShort = propertyAddress ? propertyAddress.split(",")[0] : "";
    doc.text(`📍 ${locationShort}`, margin, heroHeight - 10);

    yPosition = heroHeight + 15;

    // ============================================
    // Características principales (badges)
    // ============================================
    const features = [];
    if (sizeSqm) features.push({ icon: "📐", text: `${sizeSqm} m²` });

    // Detectar características de zonas comunes
    const hasPool = commonRooms.some((r) =>
      r.name.toLowerCase().includes("piscina")
    );
    const hasGarden = commonRooms.some((r) =>
      r.name.toLowerCase().includes("jardín")
    );
    const hasParking = commonRooms.some(
      (r) =>
        r.name.toLowerCase().includes("parking") ||
        r.name.toLowerCase().includes("garaje")
    );
    const hasTerrace = commonRooms.some((r) =>
      r.name.toLowerCase().includes("terraza")
    );

    if (hasPool) features.push({ icon: "🏊", text: "Piscina" });
    if (hasGarden) features.push({ icon: "🌳", text: "Jardín" });
    if (hasTerrace) features.push({ icon: "☀️", text: "Terraza" });
    if (hasParking) features.push({ icon: "🚗", text: "Parking" });
    features.push({ icon: "📶", text: "WiFi incluido" });

    if (features.length > 0) {
      let featureX = margin;
      features.forEach((feat, idx) => {
        if (idx < 5) {
          // Máximo 5 badges
          const badgeWidth = doc.getTextWidth(feat.text) + 20;

          doc.setFillColor(...this.colors.lightGray);
          doc.roundedRect(featureX, yPosition, badgeWidth, 18, 3, 3, "F");

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...this.colors.dark);
          doc.text(`${feat.icon} ${feat.text}`, featureX + 5, yPosition + 12);

          featureX += badgeWidth + 8;
        }
      });
      yPosition += 30;
    }

    // ============================================
    // Descripción
    // ============================================
    if (description && description.trim()) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Sobre la habitación", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.gray);
      const descLines = doc.splitTextToSize(
        description,
        pageWidth - 2 * margin
      );
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 10;
    }

    // ============================================
    // Galería de fotos de la habitación
    // ============================================
    const roomPhotos = photos.slice(1); // Excluir la primera que ya es el hero
    if (roomPhotos.length > 0) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Galería", margin, yPosition);
      yPosition += 8;

      const photosPerRow = Math.min(roomPhotos.length, 3);
      const photoGap = 6;
      const photoWidth =
        (pageWidth - 2 * margin - (photosPerRow - 1) * photoGap) / photosPerRow;
      const photoHeight = 50;

      let photoCol = 0;
      for (let i = 0; i < Math.min(roomPhotos.length, 6); i++) {
        // Verificar espacio
        if (yPosition + photoHeight > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        try {
          const photoUrl =
            typeof roomPhotos[i] === "string"
              ? roomPhotos[i]
              : roomPhotos[i].url || roomPhotos[i];
          const imgData = await this.loadImageAsBase64(photoUrl);

          if (imgData) {
            const photoX = margin + photoCol * (photoWidth + photoGap);

            // Recortar imagen para que quepa en el espacio
            doc.addImage(
              imgData,
              "JPEG",
              photoX,
              yPosition,
              photoWidth,
              photoHeight,
              undefined,
              "FAST"
            );

            // Borde redondeado (simulado con clip)
            doc.setDrawColor(...this.colors.lightGray);
            doc.setLineWidth(0.5);
            doc.roundedRect(
              photoX,
              yPosition,
              photoWidth,
              photoHeight,
              3,
              3,
              "S"
            );

            photoCol++;
            if (photoCol >= photosPerRow) {
              photoCol = 0;
              yPosition += photoHeight + photoGap;
            }
          }
        } catch (err) {
          console.warn("Error loading photo:", err);
        }
      }

      if (photoCol > 0) {
        yPosition += photoHeight + photoGap;
      }
      yPosition += 5;
    }

    // ============================================
    // Zonas comunes
    // ============================================
    if (commonRooms.length > 0) {
      // Verificar espacio
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...this.colors.dark);
      doc.text("Zonas comunes", margin, yPosition);
      yPosition += 8;

      // Mostrar zonas comunes con fotos si las tienen
      const roomsWithPhotos = commonRooms.filter(
        (r) => r.photos && r.photos.length > 0
      );
      const roomsWithoutPhotos = commonRooms.filter(
        (r) => !r.photos || r.photos.length === 0
      );

      if (roomsWithPhotos.length > 0) {
        const commonPhotoWidth = (pageWidth - 2 * margin - 6) / 2;
        const commonPhotoHeight = 45;
        let commonCol = 0;

        for (const room of roomsWithPhotos.slice(0, 4)) {
          if (yPosition + commonPhotoHeight + 15 > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          try {
            const photoUrl =
              typeof room.photos[0] === "string"
                ? room.photos[0]
                : room.photos[0].url || room.photos[0];
            const imgData = await this.loadImageAsBase64(photoUrl);

            if (imgData) {
              const photoX = margin + commonCol * (commonPhotoWidth + 6);

              doc.addImage(
                imgData,
                "JPEG",
                photoX,
                yPosition,
                commonPhotoWidth,
                commonPhotoHeight,
                undefined,
                "FAST"
              );

              // Etiqueta sobre la foto
              doc.setFillColor(0, 0, 0);
              doc.setGState(new doc.GState({ opacity: 0.6 }));
              doc.rect(
                photoX,
                yPosition + commonPhotoHeight - 15,
                commonPhotoWidth,
                15,
                "F"
              );
              doc.setGState(new doc.GState({ opacity: 1 }));

              doc.setFontSize(9);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(...this.colors.white);
              doc.text(
                room.name,
                photoX + 5,
                yPosition + commonPhotoHeight - 5
              );

              commonCol++;
              if (commonCol >= 2) {
                commonCol = 0;
                yPosition += commonPhotoHeight + 8;
              }
            }
          } catch (err) {
            console.warn("Error loading common room photo:", err);
          }
        }

        if (commonCol > 0) {
          yPosition += commonPhotoHeight + 8;
        }
      }

      // Listar zonas sin fotos
      if (roomsWithoutPhotos.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...this.colors.gray);
        const commonList = roomsWithoutPhotos.map((r) => r.name).join(" • ");
        const listLines = doc.splitTextToSize(
          `Además: ${commonList}`,
          pageWidth - 2 * margin
        );
        doc.text(listLines, margin, yPosition);
        yPosition += listLines.length * 5 + 5;
      }

      yPosition += 10;
    }

    // ============================================
    // Box de información de alquiler
    // ============================================
    if (yPosition > pageHeight - 70) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 55, 5, 5, "F");

    // Línea decorativa superior
    doc.setFillColor(...this.colors.primary);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 4, "F");

    yPosition += 15;

    // Grid de info
    const infoColWidth = (pageWidth - 2 * margin) / 3;

    // Columna 1: Precio
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text("ALQUILER MENSUAL", margin + 10, yPosition);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(
      `${parseFloat(monthlyRent || 0).toFixed(0)}€`,
      margin + 10,
      yPosition + 12
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(expenses || "+ gastos", margin + 10, yPosition + 20);

    // Columna 2: Depósito
    doc.setFontSize(9);
    doc.text("DEPÓSITO", margin + infoColWidth + 10, yPosition);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.secondary);
    const depositText = depositAmount
      ? `${parseFloat(depositAmount).toFixed(0)}€`
      : "1 mes";
    doc.text(depositText, margin + infoColWidth + 10, yPosition + 12);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text("Reembolsable", margin + infoColWidth + 10, yPosition + 20);

    // Columna 3: Estancia mínima
    doc.setFontSize(9);
    doc.text("ESTANCIA MÍNIMA", margin + 2 * infoColWidth + 10, yPosition);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.accent);
    doc.text("6 meses", margin + 2 * infoColWidth + 10, yPosition + 12);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    doc.text(
      "Disponible ahora",
      margin + 2 * infoColWidth + 10,
      yPosition + 20
    );

    yPosition += 50;

    // ============================================
    // Ubicación
    // ============================================
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text("📍 Ubicación", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...this.colors.gray);
    if (propertyAddress) {
      const addrLines = doc.splitTextToSize(
        propertyAddress,
        pageWidth - 2 * margin
      );
      doc.text(addrLines, margin, yPosition);
      yPosition += addrLines.length * 5 + 10;
    }

    // ============================================
    // Contacto (footer)
    // ============================================
    // Footer fijo en la parte inferior
    const footerY = pageHeight - 25;

    doc.setFillColor(...this.colors.primary);
    doc.rect(0, footerY - 5, pageWidth, 30, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.white);
    doc.text("¿Interesado? Contacta ahora", margin, footerY + 8);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const contactText = ownerContact || "WhatsApp preferiblemente";
    doc.text(contactText, pageWidth - margin, footerY + 8, { align: "right" });

    // Guardar
    const fileName = `Anuncio_${
      locationShort.replace(/\s+/g, "_") || "Habitacion"
    }_${Date.now()}.pdf`;
    doc.save(fileName);
    return doc;
  },

  // ============================================
  // Helpers privados
  // ============================================

  /**
   * Dibuja un header de sección con línea decorativa
   */
  _drawSectionHeader(doc, text, x, y, pageWidth) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.primary);
    doc.text(text, x, y);

    // Línea decorativa
    const textWidth = doc.getTextWidth(text);
    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(2);
    doc.line(x, y + 3, x + textWidth, y + 3);

    // Línea gris más larga
    doc.setDrawColor(...this.colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(x + textWidth + 5, y + 3, pageWidth - 20, y + 3);
  },

  /**
   * Dibuja un box de información con icono
   */
  _drawInfoBox(doc, x, y, width, height, { label, value, subtext, color }) {
    // Fondo
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(x, y, width, height, 3, 3, "F");

    // Barra de color lateral
    doc.setFillColor(...color);
    doc.rect(x, y, 4, height, "F");

    // Etiqueta
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(label, x + 10, y + 10);

    // Valor
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...this.colors.dark);
    doc.text(value, x + 10, y + 22);

    // Subtexto
    if (subtext) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...this.colors.gray);
      const lines = doc.splitTextToSize(subtext, width - 15);
      doc.text(lines[0], x + 10, y + 32);
    }
  },

  /**
   * Carga una imagen y devuelve el objeto Image
   */
  async _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * Carga una imagen desde URL y la convierte a base64
   */
  async loadImageAsBase64(url) {
    try {
      if (!url) return null;
      if (url.startsWith("data:")) return url;

      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        console.warn("Error fetching image:", response.status);
        return null;
      }
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

  /**
   * Convierte un número a palabras en español
   */
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
        "dieciséis",
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
