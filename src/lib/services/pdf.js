import jsPDF from "jspdf";

/**
 * Servicio para generar PDFs de contratos y anuncios
 */
export const pdfService = {
  /**
   * Genera un PDF de contrato de alquiler
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
    const margin = 20;
    let yPosition = margin;

    // Función helper para agregar texto con saltos de línea automáticos
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 12,
        fontStyle = "normal",
        align = "left",
        maxWidth = pageWidth - 2 * margin,
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont(undefined, fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.35) + 5;
    };

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("CONTRATO DE ALQUILER DE HABITACIÓN", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Fecha del contrato
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    yPosition += addText(
      `En ${propertyAddress}, a ${today},`,
      margin,
      yPosition
    );

    yPosition += 10;

    // PARTES
    yPosition += addText("REUNIDOS", margin, yPosition, {
      fontSize: 14,
      fontStyle: "bold",
    });
    yPosition += 5;

    yPosition += addText("De una parte:", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    yPosition += addText(
      `${ownerName}${
        ownerDni ? `, con DNI ${ownerDni}` : ""
      }, en calidad de propietario del inmueble situado en ${propertyAddress}, que en adelante se denominará EL ARRENDADOR.`,
      margin + 10,
      yPosition
    );
    yPosition += 10;

    yPosition += addText("De otra parte:", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    yPosition += addText(
      `${tenantName}${tenantDni ? `, con DNI ${tenantDni}` : ""}${
        tenantEmail ? `, con email ${tenantEmail}` : ""
      }${
        tenantPhone ? ` y teléfono ${tenantPhone}` : ""
      }, que en adelante se denominará EL ARRENDATARIO.`,
      margin + 10,
      yPosition
    );
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += addText(
      "Ambas partes, de mutuo acuerdo, se comprometen al siguiente:",
      margin,
      yPosition,
      { fontSize: 12, fontStyle: "bold" }
    );
    yPosition += 10;

    // CLÁUSULAS
    yPosition += addText("CLÁUSULAS", margin, yPosition, {
      fontSize: 14,
      fontStyle: "bold",
    });
    yPosition += 5;

    // Cláusula 1: Objeto del contrato
    yPosition += addText("1. OBJETO DEL CONTRATO", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    yPosition += addText(
      `EL ARRENDADOR cede en alquiler a EL ARRENDATARIO la habitación denominada "${roomName}" ubicada en la propiedad "${propertyName}", situada en ${propertyAddress}, así como el uso compartido de las zonas comunes de la vivienda (cocina, baño, salón, etc.).`,
      margin + 10,
      yPosition
    );
    yPosition += 10;

    // Cláusula 2: Duración
    yPosition += addText("2. DURACIÓN DEL CONTRATO", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    const startDateFormatted = new Date(startDate).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const endDateFormatted = new Date(endDate).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    yPosition += addText(
      `El presente contrato tendrá una duración de ${
        contractMonths || 12
      } meses, comenzando el ${startDateFormatted} y finalizando el ${endDateFormatted}.`,
      margin + 10,
      yPosition
    );
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    // Cláusula 3: Precio
    yPosition += addText("3. PRECIO Y FORMA DE PAGO", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    const monthlyRentNum = parseFloat(monthlyRent) || 0;
    const monthlyRentInt = Math.floor(monthlyRentNum);
    yPosition += addText(
      `EL ARRENDATARIO se compromete a pagar a EL ARRENDADOR una cantidad mensual de ${monthlyRentNum.toFixed(
        2
      )}€ (${this.numberToWords(
        monthlyRentInt
      )} euros), que deberá ser abonada dentro de los primeros 5 días de cada mes.`,
      margin + 10,
      yPosition
    );
    if (depositAmount) {
      const depositNum = parseFloat(depositAmount) || 0;
      const depositInt = Math.floor(depositNum);
      yPosition += addText(
        `Se entregará una fianza de ${depositNum.toFixed(
          2
        )}€ (${this.numberToWords(
          depositInt
        )} euros) que será devuelta al finalizar el contrato, siempre que no existan daños en la habitación o zonas comunes.`,
        margin + 10,
        yPosition
      );
    }
    yPosition += 10;

    // Cláusula 4: Obligaciones
    yPosition += addText("4. OBLIGACIONES", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    const obligations = [
      "EL ARRENDATARIO deberá hacer un uso adecuado de la habitación y zonas comunes.",
      "Queda prohibido realizar modificaciones en la habitación sin autorización escrita del propietario.",
      "EL ARRENDATARIO deberá mantener la habitación en buen estado de conservación.",
      "El uso de las zonas comunes deberá realizarse con respeto hacia los demás inquilinos.",
      "Queda prohibido subarrendar la habitación sin autorización del propietario.",
    ];
    obligations.forEach((obligation, index) => {
      yPosition += addText(
        `${index + 1}. ${obligation}`,
        margin + 10,
        yPosition
      );
    });
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    // Notas adicionales si existen
    if (contractNotes) {
      yPosition += addText("5. NOTAS ADICIONALES", margin, yPosition, {
        fontSize: 12,
        fontStyle: "bold",
      });
      yPosition += addText(contractNotes, margin + 10, yPosition);
      yPosition += 10;
    }

    // FIRMAS
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += addText(
      "Y para que así conste, firman ambas partes:",
      margin,
      yPosition,
      { fontSize: 12, fontStyle: "italic" }
    );
    yPosition += 15;

    // Firma Arrendador
    yPosition += addText("EL ARRENDADOR", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    yPosition += 20;
    doc.line(margin, yPosition, margin + 80, yPosition);
    yPosition += 5;
    yPosition += addText(`${ownerName}`, margin, yPosition, { fontSize: 10 });

    yPosition += 20;

    // Firma Arrendatario
    yPosition += addText("EL ARRENDATARIO", margin, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
    });
    yPosition += 20;
    doc.line(margin, yPosition, margin + 80, yPosition);
    yPosition += 5;
    yPosition += addText(`${tenantName}`, margin, yPosition, { fontSize: 10 });

    // Guardar el PDF
    const fileName = `Contrato_${roomName}_${tenantName.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.pdf`;
    doc.save(fileName);

    return doc;
  },

  /**
   * Carga una imagen desde URL y la convierte a base64
   */
  async loadImageAsBase64(url) {
    try {
      if (!url) return null;

      // Si es base64 ya, devolverlo
      if (url.startsWith("data:")) return url;

      // Intentar cargar la imagen con diferentes estrategias
      try {
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
        });

        if (!response.ok) {
          console.warn(`Error fetching image (${response.status}):`, url);
          return null;
        }

        const blob = await response.blob();

        // Validar que sea una imagen
        if (!blob.type.startsWith("image/")) {
          console.warn("URL no es una imagen:", url);
          return null;
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result);
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => {
            console.warn("Error al leer la imagen:", url);
            resolve(null); // Resolver con null en lugar de rechazar
          };
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        console.warn("Error al hacer fetch de la imagen:", url, fetchError);
        return null;
      }
    } catch (error) {
      // Capturar cualquier error inesperado
      console.warn("Error general al cargar imagen:", url, error);
      return null;
    }
  },

  /**
   * Genera un PDF de anuncio profesional para una habitación
   */
  async generateRoomAd(roomData) {
    try {
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
      let yPosition = margin;

      // Colores de marca
      const primaryColor = [79, 70, 229]; // Indigo-600
      const textDark = [31, 41, 55]; // Gray-800
      const textMuted = [107, 114, 128]; // Gray-500

      // Función helper para agregar texto
      const addText = (text, x, y, options = {}) => {
        const {
          fontSize = 11,
          fontStyle = "normal",
          align = "left",
          maxWidth = pageWidth - 2 * margin,
          color = textDark,
        } = options;

        doc.setFontSize(fontSize);
        doc.setFont(undefined, fontStyle);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, { align });
        doc.setTextColor(0, 0, 0);
        return lines.length * (fontSize * 0.4) + 2;
      };

      // === HEADER CON FONDO DE COLOR ===
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, "F");

      // Título en el header
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);

      let titleText = "🏠 SE ALQUILA HABITACIÓN";
      doc.text(titleText, pageWidth / 2, 15, { align: "center" });

      // Subtítulo con dirección
      if (propertyAddress) {
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.text(propertyAddress.split(",")[0], pageWidth / 2, 25, {
          align: "center",
        });
      }

      doc.setTextColor(0, 0, 0);
      yPosition = 45;

      // === PRECIO DESTACADO ===
      const rentAmount = parseFloat(monthlyRent || 0);
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, "F");

      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...primaryColor);
      doc.text(`${rentAmount.toFixed(0)}€/mes`, pageWidth / 2, yPosition + 16, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);

      yPosition += 35;

      // === FOTOS DE LA HABITACIÓN ===
      if (photos.length > 0) {
        const photosPerRow = 2;
        const imgGap = 8;
        const availableWidth = pageWidth - 2 * margin;
        const imgWidth = (availableWidth - imgGap) / photosPerRow;
        const maxImgHeight = 70;

        let currentCol = 0;
        let rowHeight = 0;
        let successfulImages = 0;

        for (let i = 0; i < Math.min(photos.length, 4); i++) {
          // Máximo 4 fotos
          const photo = photos[i];

          // Verificar si necesitamos nueva página
          if (
            currentCol === 0 &&
            yPosition + maxImgHeight > pageHeight - margin - 30
          ) {
            doc.addPage();
            yPosition = margin;
          }

          try {
            const imageUrl =
              typeof photo === "string" ? photo : photo.url || photo;
            const imgData = await this.loadImageAsBase64(imageUrl);

            if (imgData) {
              const img = new Image();
              const loadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error("Timeout")),
                  5000
                );
                img.onload = () => {
                  clearTimeout(timeout);
                  resolve(null);
                };
                img.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error("Load failed"));
                };
                img.src = imgData;
              });

              await loadPromise;

              if (img.width > 0 && img.height > 0) {
                const aspectRatio = img.height / img.width;
                let finalImgWidth = imgWidth;
                let finalImgHeight = imgWidth * aspectRatio;

                if (finalImgHeight > maxImgHeight) {
                  finalImgWidth = maxImgHeight / aspectRatio;
                  finalImgHeight = maxImgHeight;
                }

                const imgX =
                  margin +
                  currentCol * (imgWidth + imgGap) +
                  (imgWidth - finalImgWidth) / 2;

                if (finalImgHeight > rowHeight) rowHeight = finalImgHeight;

                doc.addImage(
                  imgData,
                  "JPEG",
                  imgX,
                  yPosition,
                  finalImgWidth,
                  finalImgHeight,
                  undefined,
                  "FAST"
                );
                successfulImages++;

                currentCol++;
                if (currentCol >= photosPerRow) {
                  currentCol = 0;
                  yPosition += rowHeight + imgGap;
                  rowHeight = 0;
                }
              }
            }
          } catch (err) {
            console.warn(`Error cargando foto ${i + 1}:`, err?.message || err);
          }
        }

        if (currentCol > 0 && rowHeight > 0) {
          yPosition += rowHeight + imgGap;
        }

        yPosition += 8;
      }

      // === DETALLES DE LA HABITACIÓN ===
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...primaryColor);
      yPosition += addText("📋 Detalles de la habitación", margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 3;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");

      // Solo mostrar datos reales
      if (sizeSqm) {
        yPosition += addText(`• Tamaño: ${sizeSqm} m²`, margin + 5, yPosition);
      }
      if (description && description.trim()) {
        yPosition += addText(`• ${description}`, margin + 5, yPosition);
      }
      yPosition += 10;

      // === ZONAS COMUNES ===
      if (commonRooms.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primaryColor);
        yPosition += addText("🏡 Zonas comunes incluidas", margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 3;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");

        const roomsList = commonRooms
          .map((room) => `• ${room.name}`)
          .join("\n");
        yPosition += addText(roomsList, margin + 5, yPosition);
        yPosition += 10;
      }

      // === UBICACIÓN ===
      if (propertyAddress) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primaryColor);
        yPosition += addText("📍 Ubicación", margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 3;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        yPosition += addText(`• ${propertyAddress}`, margin + 5, yPosition);
        yPosition += 10;
      }

      // === CONDICIONES ===
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...primaryColor);
      yPosition += addText("💰 Condiciones", margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 3;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");

      const rentText = `• Alquiler: ${rentAmount.toFixed(0)}€/mes`;
      const expensesText = expenses
        ? ` (${expenses})`
        : " (gastos no incluidos)";
      yPosition += addText(rentText + expensesText, margin + 5, yPosition);

      if (depositAmount) {
        yPosition += addText(
          `• Fianza: ${parseFloat(depositAmount).toFixed(0)}€`,
          margin + 5,
          yPosition
        );
      }
      yPosition += 10;

      // === CONTACTO ===
      if (ownerContact) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primaryColor);
        yPosition += addText("📞 Contacto", margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 3;

        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        yPosition += addText(`• ${ownerContact}`, margin + 5, yPosition);
      }

      // === PIE DE PÁGINA ===
      const today = new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.setFontSize(8);
      doc.setTextColor(...textMuted);
      doc.text(`Generado el ${today}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      // Guardar el PDF
      try {
        const fileName = `Anuncio_${
          propertyAddress
            ? propertyAddress.split(",")[0].replace(/\s+/g, "_")
            : "Habitacion"
        }_${new Date().getTime()}.pdf`;
        doc.save(fileName);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (saveError) {
        console.warn(
          "Error al guardar PDF con nombre personalizado:",
          saveError
        );
        const simpleFileName = `Anuncio_${new Date().getTime()}.pdf`;
        doc.save(simpleFileName);
      }

      return doc;
    } catch (error) {
      console.error("Error al generar PDF:", error);
      throw error;
    }
  },

  /**
   * Convierte un número a palabras en español (básico)
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
    return num.toString(); // Para números mayores, devolver el número
  },
};
