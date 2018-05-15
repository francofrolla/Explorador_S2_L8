# Explorador_S2_L8
Una interfaz grafica (GUI) para la búsqueda, procesamiento y recorte de imágenes Sentinel 2 y Landsat 8 en la nube mediante Google Earth Engine. Especialmente diseñado para la rapida busqueda y elaboracion de NDVI en lotes agricolas.
email contacto: frolla.franco@inta.gob.ar

Requisitos
1- Tener cuenta de gmail y acceso a Google Earth Engine (GEE). GEE es libre para su uso en investigacion como asi para evaluacion de distintos programas como el presente. 

https://signup.earthengine.google.com/

2-Una vez llegado el mail de confirmacion de GEE. Ingresar a:
https://code.earthengine.google.com/?accept_repo=users/francofrolla/Explorador_S2_L8

3- Clikear en "Run"

4-El programa utilizara el poligono con la denominacion "poligono_lote" para la busqueda y recorte de imagenes. El poligono "poligono_campo" puede ser eliminado, arrastrado o modificado, pudiendo dibujarlo con las herramientas de geometria que se indican en la posicion superior derecha.

Al seleccionar el poligono y oprimir "Run" el programa buscara las imagenes de Sentinel 2 que abarquen el area del poligno para el periodo de tiempo ingresado. Si se selecciona la opcions "Landsat 8" la busqueda cambia a Landsat 8.

5- Para ambos satelites se ofrecen para visualizacion y descarga distintas combinaciones de bandas. Color Natural, Falso Infrarrojo y Agricultura. El boton NDVI genera el indice para el poligno indicado, no se calcula NDVI para toda la escena. 

6-Descarga. Existen dos tipos de descarga "Exportar vista previa" la cual descarga la combinacion de bandas que se este visualizando en la extension de la vista actual. "Exportar recorte" descarga el NDVI para el lote seleccionado en el punto 4.

Al clickear en cualquiera de las descargas se habilita una nueva tara en la solapa "Tasks" (extremo superior izquierdo de la pantalla), donde se indica la banda o ndvi (Sentinel 2 o Landsat 8) a descargar. Clik en "Run" para inicar la descarga.

La descarga solo se pueden almacenear en Google Drive, pudiendo de este descargarlo a donde querramos. 

