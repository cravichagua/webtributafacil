// functions/enviar.js
// IMPORTANTE: El archivo debe estar en la carpeta 'functions' en la raíz del proyecto

export async function onRequestPost(context) {
  const { request, env } = context;

  // Configuración de headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/plain; charset=utf-8'
  };

  try {
    console.log('🚀 Procesando petición POST en /enviar');
    
    // Obtener datos del formulario
    const formData = await request.formData();
    const datos = {
      nombre: formData.get('nombre')?.trim(),
      apellido: formData.get('apellido')?.trim(),
      numeroCelular: formData.get('numeroCelular')?.trim(),
      correoElectronico: formData.get('correoElectronico')?.trim(),
      nombreEmpresa: formData.get('nombreEmpresa')?.trim(),
      mensaje: formData.get('mensaje')?.trim()
    };

    console.log('📋 Datos recibidos:', { ...datos, correoElectronico: '***' });

    // Validación de campos requeridos
    if (!datos.nombre || !datos.apellido || !datos.correoElectronico || !datos.mensaje) {
      console.log('❌ Validación fallida: campos requeridos faltantes');
      return new Response('Todos los campos requeridos deben ser completados.', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.correoElectronico)) {
      console.log('❌ Validación fallida: formato de email inválido');
      return new Response('El formato del correo electrónico no es válido.', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Obtener configuración desde variables de entorno
    const apiKey = env.Resend_APIKEY;
    const emailTo = env.EMAIL_TO || 'contacto@tributafacil.online';
    const emailFrom = env.EMAIL_FROM || 'Contacto Web <no-reply@tributafacil.online>';

    console.log('🔑 Variables de entorno:', {
      hasApiKey: !!apiKey,
      emailTo,
      emailFrom
    });

    // Verificar que la API key está configurada
    if (!apiKey) {
      console.error('❌ Resend_APIKEY no está configurado en las variables de entorno');
      return new Response('Error de configuración del servidor. Contacta al administrador.', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Preparar el contenido del email
    const emailContent = {
      from: emailFrom,
      to: [emailTo],
      reply_to: datos.correoElectronico,
      subject: `📧 Nuevo contacto: ${datos.nombre} ${datos.apellido}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0; text-align: center;">💼 Nuevo Mensaje desde Tributa Fácil</h2>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="border-left: 4px solid #667eea; padding-left: 20px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 15px;">📋 Información del Cliente</h3>
              <p style="margin: 8px 0;"><strong>👤 Nombre:</strong> ${datos.nombre} ${datos.apellido}</p>
              <p style="margin: 8px 0;"><strong>📧 Email:</strong> <a href="mailto:${datos.correoElectronico}" style="color: #667eea;">${datos.correoElectronico}</a></p>
              <p style="margin: 8px 0;"><strong>📱 Celular:</strong> <a href="tel:${datos.numeroCelular}" style="color: #667eea;">${datos.numeroCelular}</a></p>
              <p style="margin: 8px 0;"><strong>🏢 Empresa:</strong> ${datos.nombreEmpresa || 'No especificada'}</p>
            </div>
            
            <div style="border-left: 4px solid #28a745; padding-left: 20px;">
              <h3 style="color: #333; margin-bottom: 15px;">💬 Mensaje</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0; line-height: 1.6; color: #495057;">${datos.mensaje}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: white; border-radius: 10px;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              📅 Recibido el ${new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      `
    };

    // Enviar email usando Resend API
    console.log('📤 Enviando email a través de Resend...');
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(emailContent)
    });

    const resendData = await resendResponse.json();
    console.log('📬 Respuesta de Resend:', resendResponse.status, resendData);

    if (resendResponse.ok) {
      console.log('✅ Email enviado exitosamente:', resendData.id);
      return new Response('¡Mensaje enviado con éxito! Nos contactaremos contigo pronto.', { 
        status: 200, 
        headers: corsHeaders 
      });
    } else {
      console.error('❌ Error de Resend API:', resendData);
      return new Response('Error al enviar el mensaje. Por favor, intenta nuevamente.', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return new Response('Error interno del servidor. Por favor, contacta al soporte técnico.', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Manejar peticiones OPTIONS para CORS
export async function onRequestOptions(context) {
  console.log('🔄 Procesando petición OPTIONS para CORS');
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}