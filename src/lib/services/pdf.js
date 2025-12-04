import jsPDF from 'jspdf';

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
      ownerName = 'Propietario',
      ownerDni = ''
    } = contractData;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Función helper para agregar texto con saltos de línea automáticos
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 12,
        fontStyle = 'normal',
        align = 'left',
        maxWidth = pageWidth - 2 * margin
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont(undefined, fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.35) + 5;
    };

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRATO DE ALQUILER DE HABITACIÓN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Fecha del contrato
    const today = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    yPosition += addText(`En ${propertyAddress}, a ${today},`, margin, yPosition);

    yPosition += 10;

    // PARTES
    yPosition += addText('REUNIDOS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
    yPosition += 5;

    yPosition += addText('De una parte:', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += addText(`${ownerName}${ownerDni ? `, con DNI ${ownerDni}` : ''}, en calidad de propietario del inmueble situado en ${propertyAddress}, que en adelante se denominará EL ARRENDADOR.`, margin + 10, yPosition);
    yPosition += 10;

    yPosition += addText('De otra parte:', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += addText(`${tenantName}${tenantDni ? `, con DNI ${tenantDni}` : ''}${tenantEmail ? `, con email ${tenantEmail}` : ''}${tenantPhone ? ` y teléfono ${tenantPhone}` : ''}, que en adelante se denominará EL ARRENDATARIO.`, margin + 10, yPosition);
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += addText('Ambas partes, de mutuo acuerdo, se comprometen al siguiente:', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 10;

    // CLÁUSULAS
    yPosition += addText('CLÁUSULAS', margin, yPosition, { fontSize: 14, fontStyle: 'bold' });
    yPosition += 5;

    // Cláusula 1: Objeto del contrato
    yPosition += addText('1. OBJETO DEL CONTRATO', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += addText(`EL ARRENDADOR cede en alquiler a EL ARRENDATARIO la habitación denominada "${roomName}" ubicada en la propiedad "${propertyName}", situada en ${propertyAddress}, así como el uso compartido de las zonas comunes de la vivienda (cocina, baño, salón, etc.).`, margin + 10, yPosition);
    yPosition += 10;

    // Cláusula 2: Duración
    yPosition += addText('2. DURACIÓN DEL CONTRATO', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    const startDateFormatted = new Date(startDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const endDateFormatted = new Date(endDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    yPosition += addText(`El presente contrato tendrá una duración de ${contractMonths || 12} meses, comenzando el ${startDateFormatted} y finalizando el ${endDateFormatted}.`, margin + 10, yPosition);
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    // Cláusula 3: Precio
    yPosition += addText('3. PRECIO Y FORMA DE PAGO', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
      const monthlyRentNum = parseFloat(monthlyRent) || 0;
      const monthlyRentInt = Math.floor(monthlyRentNum);
      yPosition += addText(`EL ARRENDATARIO se compromete a pagar a EL ARRENDADOR una cantidad mensual de ${monthlyRentNum.toFixed(2)}€ (${this.numberToWords(monthlyRentInt)} euros), que deberá ser abonada dentro de los primeros 5 días de cada mes.`, margin + 10, yPosition);
      if (depositAmount) {
        const depositNum = parseFloat(depositAmount) || 0;
        const depositInt = Math.floor(depositNum);
        yPosition += addText(`Se entregará una fianza de ${depositNum.toFixed(2)}€ (${this.numberToWords(depositInt)} euros) que será devuelta al finalizar el contrato, siempre que no existan daños en la habitación o zonas comunes.`, margin + 10, yPosition);
      }
    yPosition += 10;

    // Cláusula 4: Obligaciones
    yPosition += addText('4. OBLIGACIONES', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    const obligations = [
      'EL ARRENDATARIO deberá hacer un uso adecuado de la habitación y zonas comunes.',
      'Queda prohibido realizar modificaciones en la habitación sin autorización escrita del propietario.',
      'EL ARRENDATARIO deberá mantener la habitación en buen estado de conservación.',
      'El uso de las zonas comunes deberá realizarse con respeto hacia los demás inquilinos.',
      'Queda prohibido subarrendar la habitación sin autorización del propietario.'
    ];
    obligations.forEach((obligation, index) => {
      yPosition += addText(`${index + 1}. ${obligation}`, margin + 10, yPosition);
    });
    yPosition += 10;

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    // Notas adicionales si existen
    if (contractNotes) {
      yPosition += addText('5. NOTAS ADICIONALES', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
      yPosition += addText(contractNotes, margin + 10, yPosition);
      yPosition += 10;
    }

    // FIRMAS
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += addText('Y para que así conste, firman ambas partes:', margin, yPosition, { fontSize: 12, fontStyle: 'italic' });
    yPosition += 15;

    // Firma Arrendador
    yPosition += addText('EL ARRENDADOR', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 20;
    doc.line(margin, yPosition, margin + 80, yPosition);
    yPosition += 5;
    yPosition += addText(`${ownerName}`, margin, yPosition, { fontSize: 10 });

    yPosition += 20;

    // Firma Arrendatario
    yPosition += addText('EL ARRENDATARIO', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 20;
    doc.line(margin, yPosition, margin + 80, yPosition);
    yPosition += 5;
    yPosition += addText(`${tenantName}`, margin, yPosition, { fontSize: 10 });

    // Guardar el PDF
    const fileName = `Contrato_${roomName}_${tenantName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
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
      if (url.startsWith('data:')) return url;
      
      // Intentar cargar la imagen con diferentes estrategias
      try {
        const response = await fetch(url, { 
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          console.warn(`Error fetching image (${response.status}):`, url);
          return null;
        }
        
        const blob = await response.blob();
        
        // Validar que sea una imagen
        if (!blob.type.startsWith('image/')) {
          console.warn('URL no es una imagen:', url);
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
            console.warn('Error al leer la imagen:', url);
            resolve(null); // Resolver con null en lugar de rechazar
          };
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        console.warn('Error al hacer fetch de la imagen:', url, fetchError);
        return null;
      }
    } catch (error) {
      // Capturar cualquier error inesperado
      console.warn('Error general al cargar imagen:', url, error);
      return null;
    }
  },

  /**
   * Genera un PDF de anuncio profesional para una habitación
   */
  async generateRoomAd(roomData) {
    // Silenciar errores de carga de recursos que pueden ocurrir después de generar el PDF
    const originalConsoleError = console.error;
    const errorHandler = (error) => {
      const errorMsg = String(error?.message || error || '').toLowerCase();
      // Silenciar errores comunes de carga de recursos
      if (errorMsg.includes('load failed') || 
          errorMsg.includes('typeerror') ||
          errorMsg.includes('networkerror') ||
          errorMsg.includes('failed to load')) {
        // Estos errores son normales cuando algunas imágenes no se pueden cargar
        return;
      }
      // Mostrar otros errores normalmente
      originalConsoleError.apply(console, arguments);
    };
    
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
        ownerContact = null
      } = roomData;

      const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    // Función helper para agregar texto
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 11,
        fontStyle = 'normal',
        align = 'left',
        maxWidth = pageWidth - 2 * margin,
        color = [0, 0, 0]
      } = options;

      doc.setFontSize(fontSize);
      doc.setFont(undefined, fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      doc.setTextColor(0, 0, 0);
      return lines.length * (fontSize * 0.35) + 3;
    };

    // Título principal profesional
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Crear título descriptivo
    let titleText = 'Se alquila habitación';
    if (propertyName && propertyName.toLowerCase().includes('chalet')) {
      titleText += ' en chalet';
      if (commonRooms.some(r => r.name.toLowerCase().includes('jardín') || r.name.toLowerCase().includes('piscina'))) {
        const hasGarden = commonRooms.some(r => r.name.toLowerCase().includes('jardín'));
        const hasPool = commonRooms.some(r => r.name.toLowerCase().includes('piscina'));
        if (hasGarden && hasPool) {
          titleText += ' con jardín y piscina';
        } else if (hasGarden) {
          titleText += ' con jardín';
        } else if (hasPool) {
          titleText += ' con piscina';
        }
      }
    } else if (propertyAddress) {
      titleText += ` en ${propertyAddress.split(',')[0]}`;
    }
    
    doc.text(titleText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Fotos de la habitación - Galería completa
    if (photos.length > 0) {
      const photosPerRow = 2;
      const imgGap = 10;
      const availableWidth = pageWidth - 2 * margin;
      const imgWidth = (availableWidth - imgGap) / photosPerRow;
      const maxImgHeight = 90;
      
      let currentCol = 0;
      let rowHeight = 0;
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // Verificar si necesitamos nueva página antes de agregar una nueva fila
        if (currentCol === 0 && yPosition + maxImgHeight > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }
        
        try {
          const imageUrl = typeof photo === 'string' ? photo : photo.url || photo;
          const imgData = await this.loadImageAsBase64(imageUrl);
          
          if (imgData) {
            try {
              // Obtener dimensiones reales de la imagen
              const img = new Image();
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Timeout loading image'));
                }, 10000); // 10 segundos de timeout
                
                img.onload = () => {
                  clearTimeout(timeout);
                  resolve(null);
                };
                img.onerror = (err) => {
                  clearTimeout(timeout);
                  reject(err);
                };
                img.src = imgData;
              });
              
              let finalImgWidth = img.width;
              let finalImgHeight = img.height;
              
              // Validar dimensiones
              if (!finalImgWidth || !finalImgHeight || finalImgWidth <= 0 || finalImgHeight <= 0) {
                throw new Error('Invalid image dimensions');
              }
              
              // Redimensionar manteniendo proporción
              const aspectRatio = finalImgHeight / finalImgWidth;
              finalImgWidth = imgWidth;
              finalImgHeight = imgWidth * aspectRatio;
              
              // Ajustar si es muy alta
              if (finalImgHeight > maxImgHeight) {
                finalImgWidth = maxImgHeight / aspectRatio;
                finalImgHeight = maxImgHeight;
              }
              
              // Calcular posición X (centrada en su espacio)
              const imgX = margin + (currentCol * (imgWidth + imgGap)) + ((imgWidth - finalImgWidth) / 2);
              const imgY = yPosition;
              
              // Guardar la altura máxima de esta fila
              if (finalImgHeight > rowHeight) {
                rowHeight = finalImgHeight;
              }
              
              // Agregar imagen
              doc.addImage(imgData, 'JPEG', imgX, imgY, finalImgWidth, finalImgHeight, undefined, 'FAST');
              
              // Avanzar columna
              currentCol++;
              
              // Si completamos una fila, avanzar a la siguiente
              if (currentCol >= photosPerRow) {
                currentCol = 0;
                yPosition += rowHeight + imgGap;
                rowHeight = 0;
              }
            } catch (imgError) {
              // Si falla cargar la imagen, simplemente continuar con la siguiente
              console.warn(`Error procesando imagen ${i + 1}:`, imgError?.message || imgError);
              // No agregar esta imagen, continuar con la siguiente
            }
          }
        } catch (err) {
          console.warn(`Error loading photo ${i + 1}:`, err);
        }
      }
      
      // Si hay una fila incompleta, avanzar yPosition
      if (currentCol > 0 && rowHeight > 0) {
        yPosition += rowHeight + imgGap;
      }
      
      yPosition += 10;
    }

    // Sección: Sobre la habitación
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    yPosition += addText('Sobre la habitación:', margin, yPosition);
    yPosition += 3;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const roomDetails = [];
    if (sizeSqm) {
      roomDetails.push(`Es ${sizeSqm} m²`);
    }
    roomDetails.push('Muy luminosa');
    roomDetails.push('Incluye escritorio y silla');
    roomDetails.push('Cama de 90 cm con colchón y base nuevos');
    roomDetails.push('Estanterías');
    roomDetails.push('Armario empotrado');
    
    roomDetails.forEach(detail => {
      yPosition += addText(`• ${detail}`, margin + 5, yPosition);
    });
    yPosition += 8;

    // Sección: Zonas comunes
    if (commonRooms.length > 0) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      yPosition += addText('Zonas comunes:', margin, yPosition);
      yPosition += 3;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      // Listar zonas comunes
      const commonRoomsText = commonRooms.map(room => `• ${room.name}`).join('\n');
      yPosition += addText(commonRoomsText, margin + 5, yPosition);
      yPosition += 8;
      
      // Agregar fotos de zonas comunes en una galería (si hay espacio y fotos)
      const roomsWithPhotos = commonRooms.filter(r => r.photos && r.photos.length > 0);
      if (roomsWithPhotos.length > 0 && yPosition < 200) {
        // Agregar fotos en miniatura (máximo 2 por fila)
        const photosPerRow = 2;
        const imgSize = (pageWidth - 2 * margin - 10) / photosPerRow;
        let currentRow = 0;
        let currentCol = 0;
        
        for (const room of roomsWithPhotos.slice(0, 4)) { // Máximo 4 fotos
          if (yPosition + imgSize > pageHeight - margin - 20) {
            doc.addPage();
            yPosition = margin;
            currentRow = 0;
          }
          
          try {
            const photoUrl = typeof room.photos[0] === 'string' 
              ? room.photos[0] 
              : room.photos[0].url || room.photos[0];
            const imgData = await this.loadImageAsBase64(photoUrl);
            
            if (imgData) {
              try {
                // Validar que la imagen se pueda cargar
                const img = new Image();
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error('Timeout'));
                  }, 5000);
                  img.onload = () => {
                    clearTimeout(timeout);
                    resolve(null);
                  };
                  img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Image load failed'));
                  };
                  img.src = imgData;
                });
                
                const imgX = margin + 5 + (currentCol * (imgSize + 10));
                const imgY = yPosition;
                
                doc.addImage(imgData, 'JPEG', imgX, imgY, imgSize, imgSize, undefined, 'FAST');
                
                // Nombre de la zona debajo de la foto
                doc.setFontSize(8);
                doc.text(room.name, imgX + imgSize / 2, imgY + imgSize + 5, { align: 'center', maxWidth: imgSize });
                
                currentCol++;
                if (currentCol >= photosPerRow) {
                  currentCol = 0;
                  currentRow++;
                  yPosition += imgSize + 20;
                }
              } catch (imgError) {
                console.warn(`Error procesando imagen de zona común "${room.name}":`, imgError?.message || imgError);
                // Continuar sin esta imagen
              }
            }
          } catch (err) {
            console.warn(`Error cargando foto de zona común "${room.name}":`, err?.message || err);
            // Continuar sin esta imagen
          }
        }
        
        if (currentCol > 0) {
          yPosition += imgSize + 20;
        }
        yPosition += 5;
      }
    }

    // Sección: Ubicación
    if (yPosition > 240) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    yPosition += addText('Ubicación:', margin, yPosition);
    yPosition += 3;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    if (propertyAddress) {
      yPosition += addText(`• ${propertyAddress}`, margin + 5, yPosition);
    }
    yPosition += 8;

    // Sección: Alquiler
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    yPosition += addText('Alquiler:', margin, yPosition);
    yPosition += 3;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const rentText = `${parseFloat(monthlyRent || 0).toFixed(0)}€`;
    const expensesText = expenses ? ` + gastos (${expenses})` : ' + gastos (luz, agua, gas e internet)';
    const depositText = depositAmount 
      ? ` Se requiere depósito de 1 mes por adelantado (${parseFloat(depositAmount).toFixed(0)}€).`
      : ' Se requiere depósito de 1 mes por adelantado.';
    
    yPosition += addText(`• ${rentText}${expensesText}.${depositText}`, margin + 5, yPosition);
    yPosition += addText(`• Estancia mínima de 6 meses.`, margin + 5, yPosition);
    yPosition += 8;

    // Sección: Contacto
    if (yPosition > 240) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    yPosition += addText('Contacto:', margin, yPosition);
    yPosition += 3;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    if (ownerContact) {
      yPosition += addText(`• ${ownerContact}`, margin + 5, yPosition);
    } else {
      yPosition += addText(`• Preferiblemente por WhatsApp`, margin + 5, yPosition);
    }

      // Guardar el PDF
      try {
        const fileName = `Anuncio_${propertyAddress ? propertyAddress.split(',')[0].replace(/\s+/g, '_') : 'Habitacion'}_${new Date().getTime()}.pdf`;
        doc.save(fileName);
        
        // Pequeño delay para asegurar que el guardado termine antes de retornar
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (saveError) {
        // Si hay error al guardar, intentar con nombre más simple
        console.warn('Error al guardar PDF con nombre personalizado, usando nombre genérico:', saveError);
        try {
          const simpleFileName = `Anuncio_${new Date().getTime()}.pdf`;
          doc.save(simpleFileName);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (fallbackError) {
          console.error('Error al guardar PDF:', fallbackError);
          // Lanzar el error solo si realmente falla el guardado
          throw new Error('No se pudo guardar el PDF. Por favor, inténtalo de nuevo.');
        }
      }

      return doc;
    } catch (error) {
      // Capturar cualquier error no manejado
      console.error('Error general al generar PDF:', error);
      // Si el error es de carga de imágenes, no relanzarlo
      const errorMsg = String(error?.message || error || '');
      if (errorMsg.includes('load failed') || errorMsg.includes('fetch') || errorMsg.includes('TypeError')) {
        console.warn('Error de carga de imágenes ignorado, PDF generado correctamente');
        // Retornar un PDF vacío si es necesario, pero mejor lanzar el error controlado
        throw error;
      }
      throw error;
    }
  },

  /**
   * Convierte un número a palabras en español (básico)
   */
  numberToWords(num) {
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    if (num === 0) return 'cero';
    if (num < 10) return ones[num];
    if (num < 20) {
      const specials = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
      return specials[num - 10];
    }
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' y ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToWords(remainder) : '');
    }
    return num.toString(); // Para números mayores, devolver el número
  }
};

