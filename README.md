# Portafolio Académico — Frank de la Cruz Sierra

Portafolio web para organizar y publicar actividades de **Algoritmos** y **Desarrollo de Aplicaciones**.

La página permite mostrar descripciones completas, varios archivos por actividad, enlaces compartidos como Figma y contenido organizado en pestañas deslizables por grupos de ejercicios.

![Portada del portafolio](portada-portafolio.png)


## Organización por pestañas

El panel permite crear pestañas vacías, agrupar archivos o enlaces ya cargados, o crear una pestaña mientras se seleccionan archivos nuevos. También puede elegirse la pestaña de destino antes de subir cada archivo o enlace.


## Actualización
Los enlaces externos se muestran de forma destacada en la portada. El panel permite seleccionar archivos ya cargados y crear grupos automáticamente según su numeración (1.1, 1.2, 1.3 → Ejercicios 1.x).


## Enlaces compartidos
Los enlaces de Figma, GitHub, Drive, YouTube u otras webs se publican junto con los archivos. Si se deja un enlace escrito en el campo al pulsar Publicar, la web lo incorpora automáticamente.


## Asistente IA y accesos rápidos
Se añadieron accesos flotantes para el chat de IA, WhatsApp e Intranet UPLA. Consulta `CONFIGURAR_ASISTENTE_IA.md` para activar el backend de IA y personalizar el número de WhatsApp.


## IA general sin backend propio

El asistente está configurado para ejecutar WebLLM con el modelo Qwen2.5 1.5B directamente en el navegador, sin API de pago ni servidor de IA. Consulta `CONFIGURAR_ASISTENTE_IA.md` para conocer compatibilidad, primera descarga y limitaciones. La web debe servirse por HTTPS o desde un servidor local; no la abras con `file://`.
