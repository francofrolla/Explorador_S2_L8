/* 
 
 ATENCION: El presente programa no ofrece ningun tipo de garantia y no se hace responsable por el uso
 de la informacion extraida del mismo. 
 
 Sobre politicas de utilizacion de google (extraido de su sitio web):
 
 "Earth Engine is free for research, education, and nonprofit use. For commercial applications, 
 we offer paid commercial licenses. Please contact for details (earthengine-commercial@google.com)."
 
 Autor: Ing Agr. Franco Daniel Frolla. 
 parte de los codigos utilizados fueron extraidos de sitios de intercambio como Stack Exchange
 y de los ejemplos dado por GEE.
 
 _____ _   _ _______       
 |_   _| \ | |__   __|/\    
   | | |  \| |  | |  /  \   
   | | | . ` |  | | / /\ \  
  _| |_| |\  |  | |/ ____ \ 
 |_____|_| \_|  |_/_/    \_\

*/

 Map.setOptions("HYBRID")

var panel_auxiliar = ui.Panel({style: {position: 'bottom-right'}});

var panel_auxiliar2 =  ui.Panel({
  widgets: [
    ],
    style: {width: '230px', position: 'bottom-left', fontWeight: 'bold',fontSize: '15px',color: "white", backgroundColor: "#35373a" },
    layout: ui.Panel.Layout.flow('vertical'),
    })
    
var panel_auxiliar3 =  ui.Panel({
  widgets: [
    ui.Label("Cargando...", { fontWeight: 'bold',fontSize: '15px',color: "red", backgroundColor: "#35373a" }),
    ],
    style: {position: 'bottom-center', fontWeight: 'bold',fontSize: '15px',color: "white", backgroundColor: "#35373a" },
    layout: ui.Panel.Layout.flow('vertical'),
    })
  

panel_auxiliar.style().set({
  fontWeight: 'bold',  
  fontSize: '15px',
  color: "white",
  backgroundColor: "#35373a",
  });
  

 

Map.add(panel_auxiliar)


var app = {};

//funcion para dibujar lote // extraida de https://gis.stackexchange.com/questions/270033/convert-or-add-hand-drawn-geometries-to-featurecollection-as-they-are-drawn-on-g
app.dibujarlote = function() {
  var tool = new DrawAreaTool(Map)
  // subscribe to selection
  tool.onFinished(function(area) {
    app.filters.dibujarlote.setValue(false, false)
    poligono_lote = area
    app.applyFilters();
  })
 
  tool.startDrawing()

}
var DrawAreaTool = function(map) {
  this.map = map
  this.layer = ui.Map.Layer({name: 'poligono lote', visParams: { color:'yellow' }})
  this.selection = null
  this.active = false
  this.points = []
  this.area = null
  
  this.listeners = []

  var tool = this;
  
  this.initialize = function() {
    this.map.onClick(this.onMouseClick)
    this.map.layers().add(this.layer)
  }
  
  this.startDrawing = function() {
    this.active = true
    this.points = []

    this.map.style().set('cursor', 'crosshair');
    this.layer.setShown(true)
  }
  
  this.stopDrawing = function() {
    tool.active = false
    tool.map.style().set('cursor', 'hand');

    if(tool.points.length < 2) {
      return
    }

    tool.area = ee.Geometry.Polygon(tool.points)
    tool.layer.setEeObject(tool.area)

    tool.listeners.map(function(listener) {
      listener(tool.area)
    })
  }
  
  /***
   * Mouse click event handler
   */
  this.onMouseClick = function(coords) {
    if(!tool.active) {
      return
    }
    
    tool.points.push([coords.lon, coords.lat])

    var geom = tool.points.length > 1 ? ee.Geometry.LineString(tool.points) : ee.Geometry.Point(tool.points[0])
    tool.layer.setEeObject(geom)
    
    var l = ee.Geometry.LineString([tool.points[0], tool.points[tool.points.length-1]]).length(1).getInfo()

    if(tool.points.length > 1 && l / Map.getScale() < 5) {
       tool.stopDrawing()
    }
  }
  
  /***
   * Adds a new event handler, fired on feature selection. 
   */
  this.onFinished = function(listener) {
    tool.listeners.push(listener)
  }
  
  this.initialize()
}

//Termina funcion!

/** Crea los paneles. */
var coleccion = ee.ImageCollection([]);
var coleccion1 = ee.ImageCollection([]);
var que_satelite = "false";

app.createPanels = function() {
  /* Introduccion */
  var terminos = ui.Label("Terminos de uso", {color: "white",backgroundColor: "#35373a"})
  terminos.setUrl("https://earthengine.google.com/terms/" );
  app.intro = {
    panel: ui.Panel({
      widgets: [
      ui.Label({
        value: 'Explorador Sentinel 2 - Landsat 8',
        style: {fontWeight: 'bold', fontSize: '24px', margin: '10px 5px', color: "white", backgroundColor: "#35373a"}
      }),
      ui.Label({
        value: 'Esta app permite la busqueda, procesamiento  ' +
               "y descarga de imagenes Sentinel 2 o Landsat 8 " + 
               "con la tecnologia de Google Earth Engine.", 
               
        style: {color: "white",backgroundColor: "#35373a", stretch : "horizontal",textAlign: "justify"} 
      }),
      ui.Panel({
      widgets: [
      terminos,
      ],
      style: {fontWeight: 'bold', fontSize: '16px', color: "red",backgroundColor: "#35373a", margin: '5px 0px 5px 70px', textAlign: "center"},
      }),
      ui.Label({
        value: "frolla.franco@inta.gob.ar - INTA Bordenave",
        style: {fontWeight: 'bold', fontSize: '15px', margin: '10px 5px', color: "white", backgroundColor: "#35373a", textAlign: "center"}
      }),
      
    ],
      style: {color: "white", backgroundColor: "#35373a"},
    }),
    
  };

  /* Filtros. */
  app.filters = {
    titulo: ui.Label('1) Seleccionar casilla para dibujar lote.', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
    dibujarlote: ui.Checkbox({label: 'Dibujar poligono', value:false, style: {color: "white", backgroundColor: "#35373a"}}),
    limpiar: ui.Button({
       label: 'Limpiar mapa',
       style: {color: "black", backgroundColor: "#35373a"},
       onClick: function() { Map.clear(), Map.add(panel_auxiliar), Map.add(panel_auxiliar2),panel_auxiliar.clear(),panel_auxiliar2.clear(),  Map.setOptions("HYBRID") }}),
    landsat8: ui.Checkbox({label: 'Landsat 8', value: false, style: {color: "white", backgroundColor: "#35373a"}}),
    mapCenter: ui.Checkbox({label: 'Centrar mapa', value: true, style: {color: "white", backgroundColor: "#35373a"}}),
    filtrar_nubes: ui.Checkbox({label: 'Filtrar por nubes', value: true, style: {color: "white", backgroundColor: "#35373a"}}),
    startDate: ui.Textbox('YYYY-MM-DD', '2017-11-01'),
    endDate: ui.Textbox('YYYY-MM-DD', '2017-12-01'),
    applyButton: ui.Button('Aplicar filtros', app.applyFilters),
      loadingLabel: ui.Label({
      value: 'Cargando...',
      style: {stretch: 'vertical', color: 'red',backgroundColor: "#35373a", shown: false}
      })
   };
       
       
        app.filters.dibujarlote.onChange(function(checked) {
        app.dibujarlote()
          
        });

       
   que_satelite = app.filters.landsat8.getValue();
  
  
  /* Visualizacion de filtros. */
  app.filters.panel = ui.Panel({
    widgets: [
      app.filters.titulo,
      app.filters.dibujarlote,
      app.filters.limpiar,
      ui.Label('2) Seleccionar fechas (Año/Mes/Día)', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
      ui.Label("Sentinel 2: 2016-01-01 en adelante.", {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
      ui.Label("Landsat 8: 2013-06-01 en adelante.", {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
      ui.Label('Fecha inicio', app.HELPER_TEXT_STYLE), app.filters.startDate,
      ui.Label('Fecha fin', app.HELPER_TEXT_STYLE), app.filters.endDate,
      app.filters.mapCenter,
      app.filters.filtrar_nubes,
      app.filters.landsat8,
      ui.Panel({
        widgets: [
        app.filters.applyButton,
        app.filters.loadingLabel
        ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
    })
    ],
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
  });

  /* Seleccionar imagen. */
app.picker = {
    // Fucnion que reacciona ante el cambio.
    titulo: ui.Label('3) Seleccione una imagen:', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
    nro_imagenes: ui.Label("", {fontWeight: 'bold', color: "#CDE0CE", backgroundColor: "#35373a", margin: '5px 0px 5px 65px', textAlign: "center"}),
    select: ui.Select({
      placeholder: 'Seleccione una imagen',
      onChange: app.refreshMapLayer,
       }),
    // Centrar mapa
    centerButton: ui.Button('Centrar en mapa', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"},
    function() {Map.centerObject(Map.layers().get(0).get('eeObject'));})
  };

  /* la visualizacion de la seleccion de imagenes */
app.picker.panel = ui.Panel({
    widgets: [
      ui.Panel({
        widgets: [
          app.picker.titulo,
          app.picker.nro_imagenes,
          ],
          style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
      }),
      ui.Panel({
        widgets: [
        app.picker.select,
        app.picker.centerButton, 
        
        ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
    })
  ],
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
  });

//Seleccionar visualizacion

app.select_VIS = function() {
if (que_satelite === false) {
  app.VIS_OPTIONS = app.VIS_OPTIONS_S2;
  app.vis.select.items().reset(Object.keys(app.VIS_OPTIONS));
  app.vis.select.setValue(app.vis.select.items().get(0));
} else {
  app.VIS_OPTIONS = app.VIS_OPTIONS_L8;
  app.vis.select.items().reset(Object.keys(app.VIS_OPTIONS));
  app.vis.select.setValue(app.vis.select.items().get(0));
}
};

//Aca arranca el calculo de indices
var indices = {
  NDVI: ["NDVI"],
  MSAVI2: ["MSAVI2"],
  NDWI: ["NDWI"],
  EVI: ["EVI"],
  MSI: ["MSI"],
  };

var indices_calculo = function(indice_seleccionado) {
//app.setLoadingMode(true);
var imageId = app.picker.select.getValue();
var imagen_entera = ee.Image(app.COLLECTION_ID + '/' + imageId);
var image = imagen_entera.clip(poligono_lote);
var regionJSON = JSON.stringify(poligono_lote.getInfo());

if (indice_seleccionado == "NDVI" && que_satelite === false) {var indice = (image.select("B8").subtract(image.select("B4"))).divide(image.select("B8").add(image.select("B4"))).rename('NDVI'); app.vis.label2.setValue("Índice Normalizado de diferencia de Vegetación. Rouse et al., 1973")}
if (indice_seleccionado == "MSAVI2" && que_satelite === false) {var indice = image.select("B8").multiply(2).add(1).subtract(image.select("B8").multiply(2).add(1).pow(2).subtract(image.select("B8").subtract(image.select("B4")).multiply(8)).sqrt()).divide(2).rename('MSAVI2'); app.vis.label2.setValue("Índice  modificado de vegetación suelo ajustado. Qi et al., 1994")}
if (indice_seleccionado == "NDWI" && que_satelite === false)  {var indice = (image.select("B3").subtract(image.select("B8"))).divide(image.select("B3").add(image.select("B8"))).rename('NDWI'); app.vis.label2.setValue("Índice  de agua por diferencia normalizada. Gao, 1995")};
if (indice_seleccionado == "EVI" && que_satelite === false)  {var indice = (image.select("B8").subtract(image.select("B4").multiply(2.5))).divide((image.select("B8").add(image.select("B4").multiply(6)).subtract(image.select("B2").multiply(7.5)).add(1))).rename("EVI"); app.vis.label2.setValue("Índice  de vegetación mejorado. Huete et al., 2002")}  
if (indice_seleccionado == "MSI" && que_satelite === false)  {var indice = ((image.select("B11").divide(image.select("B8")))).rename("MSI"); app.vis.label2.setValue("Índice de estrés hídrico. Hunt y Rock, 1989")} 
//Landsat 8
if (indice_seleccionado == "NDVI" && que_satelite === true) {var indice = (image.select("B5").subtract(image.select("B4"))).divide(image.select("B5").add(image.select("B4"))).rename('NDVI'); app.vis.label2.setValue("Índice Normalizado de diferencia de Vegetación. Rouse et al., 1973")}
if (indice_seleccionado == "MSAVI2" && que_satelite === true) {var indice = image.select("B5").multiply(2).add(1).subtract(image.select("B5").multiply(2).add(1).pow(2).subtract(image.select("B5").subtract(image.select("B4")).multiply(8)).sqrt()).divide(2).rename('MSAVI2'); app.vis.label2.setValue("Índice  modificado de vegetación suelo ajustado. Qi et al., 1994")}
if (indice_seleccionado == "NDWI" && que_satelite === true)  {var indice = (image.select("B5").subtract(image.select("B6"))).divide(image.select("B5").add(image.select("B6"))).rename('NDWI'); app.vis.label2.setValue("Índice  de agua por diferencia normalizada. Gao, 1995")}
if (indice_seleccionado == "EVI" && que_satelite === true)  {var indice = ((image.select("B5").subtract(image.select("B4"))).divide(image.select("B5").add((image.select("B4").multiply(6)).subtract((image.select("B2").multiply(7.5)).add(1)))).multiply(2.5)).rename("EVI"); app.vis.label2.setValue("Índice  de vegetación mejorado. Huete et al., 2002")}  
if (indice_seleccionado == "MSI" && que_satelite === true)  {var indice = ((image.select("B5").divide(image.select("B6")))).rename("MSI"); app.vis.label2.setValue("Índice de estrés hídrico. Hunt y Rock, 1989")} 





 var banda = ee.String(app.vis.select_indices.getValue())


 var p90 = ee.Number(indice.reduceRegion({
            reducer: ee.Reducer.percentile([90]),
            geometry: poligono_lote,
            maxPixels: 1e9,
            scale: 10,
            }).get(banda));
            
       
  var p10 = ee.Number(indice.reduceRegion({
            reducer: ee.Reducer.percentile([10]),
            geometry: poligono_lote,
            maxPixels: 1e9,
            scale: 10,
            }).get(banda));
      
    
    var valor_p90 = p90.getInfo();
    var valor_p10 = p10.getInfo();
    var nombre = banda.getInfo();
    
    
    
    var parametros = {'name': nombre + "_" + imageId,
        'scale': 10,
        "region": regionJSON }
     
      var url_indice = indice.getDownloadURL(parametros);
      app.vis.descarga2.setUrl(url_indice);
     
    var min_2 = Math.round(valor_p10*100)/100;
    var max_2 = Math.round(valor_p90*100)/100;
     
    graficar_escala(min_2,max_2)    
    Map.addLayer(indice,{min: valor_p10, max: valor_p90, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, nombre);
   app.setLoadingMode(false); 
}


  /* Visualizacion de combinaciones de banda. */
app.vis = {
    ndviButton: ui.Button('NDVI', app.ndvi),
    descarga1:ui.Label("Descarga visualización"),
    descarga2:ui.Label("    Descarga indice  "),
    label: ui.Label(),
    label2: ui.Label('Seleccione indice', {color: "white", backgroundColor: "#35373a"}),
    select_indices : ui.Select({
      items: Object.keys(indices),
          }),
   calcular_indices : ui.Button({
       label: "Calcular",
       onClick: function() {
      app.setLoadingMode(true);
      var indice_elegido = app.vis.select_indices.getValue();
       
      var estado =  coleccion.size().getInfo() === 0; 
      var estado2 = indice_elegido === null 
      var estado3 = false;
      
      if (estado === true || estado2 === true) {var estado3 = false} else { estado3 = true };
       
       if(estado3 === true) {panel_auxiliar.clear(), indices_calculo(indice_elegido)} 
       else {
       if(estado2 === true) {panel_auxiliar.clear(), panel_auxiliar.add(ui.Label("Seleccione un indice", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))}
       if(estado === true) {panel_auxiliar.clear(), panel_auxiliar.add(ui.Label("No hay imagenes disponibles", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))}    
       }
       
        }
    }),
    // Funcion que reacciona ante cambios
      select: ui.Select({
      items: Object.keys(app.VIS_OPTIONS),
      onChange: function() {
        // actualizar la capa seleccionada
        var option = app.VIS_OPTIONS[app.vis.select.getValue()];
        app.vis.label.style().set({color: "white", backgroundColor: "#35373a" });
        app.vis.label.setValue(option.description);
        // refrescar mapa
        app.refreshMapLayer();
        app.vis.descarga1.setUrl("https://code.earthengine.google.com/");
        app.vis.descarga2.setUrl("https://code.earthengine.google.com/");
        
        
        
       }, 
       
      }
    )
};
  
 

  /* la parte grafica de la visualizacion */
  app.vis.panel = ui.Panel({
    widgets: [
      ui.Label('3) Seleccione una visualización', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
      app.vis.select,
      app.vis.label,
      app.vis.descarga1,
      //app.vis.select_indices,
      //app.vis.calcular_indices,
      ui.Panel({ 
        widgets: [
      app.vis.select_indices,
      app.vis.calcular_indices
      ],
     style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
     layout: ui.Panel.Layout.flow('horizontal'),
      }),
      app.vis.label2,
      app.vis.descarga2,
                ],
    style: app.SECTION_STYLE
  });
   
  app.vis.select_indices.setPlaceholder("Elegir Indice")

  app.vis.descarga1.style().set({
  fontWeight: 'bold',  
  fontSize: '15px',
  color: "white",
  padding: '10px 10px 10px 10px',
  border: "thick double #312D2C",
  backgroundColor: "#F3EBE9",
  
   });
   
  app.vis.descarga2.style().set({
  fontWeight: 'bold',
  fontSize: '15px',
  color: "white",
  padding: '10px 10px 10px 10px',
  border: "thick double #312D2C",
  backgroundColor: "#F3EBE9",
  });
   
   
     // seleccionar primara capa por default
  app.vis.select.setValue(app.vis.select.items().get(0));
  
var map_indice_s2 = function(indice_seleccionado) { //1
app.setLoadingMode(true);
var indice = ee.Image();

if (indice_seleccionado == "NDVI"){
    coleccion = coleccion.map (function(image) {
  indice = image.normalizedDifference(['B8', 'B4']).rename('NDVI'); 
  return image.addBands(indice);
  });
 }

if (indice_seleccionado == "NDWI"){
  coleccion = coleccion.map (function(image) {
  var indice = ((image.select("B3").subtract(image.select("B8"))).divide(image.select("B3").add(image.select("B8")))).rename('NDWI'); 
  return image.addBands(indice);
  });
}



if (indice_seleccionado == "EVI"){
  coleccion = coleccion.map (function(image) {
  var indice = ((image.select("B8").subtract(image.select("B4").multiply(2.5))).divide((image.select("B8").add(image.select("B4").multiply(6)).subtract(image.select("B2").multiply(7.5)).add(1)))).rename("EVI"); 
  return image.addBands(indice);
  });
}

if (indice_seleccionado == "MSI"){
  coleccion = coleccion.map (function(image) {
  var indice = ((image.select("B11").divide(image.select("B8")))).rename("MSI") ; 
  return image.addBands(indice);
  });
}

if (indice_seleccionado == "MSAVI2"){
  coleccion = coleccion.map (function(image) {
  var indice = (image.select("B8").multiply(2).add(1).subtract(image.select("B8").multiply(2).add(1).pow(2).subtract(image.select("B8").subtract(image.select("B4")).multiply(8)).sqrt()).divide(2)).rename('MSAVI2'); 
  return image.addBands(indice);
  });
 }

print(coleccion)

var coleccion1 = coleccion.map(function(image) {
    var cloud = image.select(indice_seleccionado);
    var cloudiness2 = cloud.reduceRegion({
    reducer: 'mean', 
    geometry: poligono_lote, 
    scale: 10,
  });
  return image.set(cloudiness2);
});

print(coleccion1)


var umbralcete = ee.Number.parse(app.media.umbral.getValue())


var coleccion1 = coleccion1.filter(ee.Filter.gt(indice_seleccionado, umbralcete));
print(coleccion1.size().getInfo() < 2)

if (coleccion1.size().getInfo() < 2) {panel_auxiliar.clear(), panel_auxiliar.add(ui.Label("No hay imagenes, seleccione un umbral mas bajo", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))}
else {


var mean = coleccion1.select(indice_seleccionado).mean();
var lote_historico = mean.clip(poligono_lote);

print(lote_historico)
var p90_lote = ee.Number(lote_historico.reduceRegion({
        reducer: ee.Reducer.percentile([90]),
        geometry: poligono_lote,
        maxPixels: 1e9,
        scale: 10,
        }).get(indice_seleccionado));
        
var p10_lote = ee.Number(lote_historico.reduceRegion({
        reducer: ee.Reducer.percentile([10]),
        geometry: poligono_lote,
        maxPixels: 1e9,
        scale: 10,
        }).get(indice_seleccionado));


var lote_p70 = p90_lote.getInfo();
var lote_p20 = p10_lote.getInfo();
var nombre_imagen= ee.String(indice_seleccionado).cat(ee.String(" medio"))
var nombre = nombre_imagen.getInfo()

var regionJSON = JSON.stringify(poligono_lote.getInfo());
var parametros = {'name': indice_seleccionado + "_medio",
        'scale': 10,
        "region": regionJSON }
     
      var url_indice = lote_historico.getDownloadURL(parametros);
      app.media.descarga3.setUrl(url_indice);


 var min_2 = Math.round(lote_p20*100)/100;
    var max_2 = Math.round(lote_p70*100)/100;
     
    graficar_escala(min_2,max_2)    


Map.addLayer(lote_historico,{'bands': [indice_seleccionado],min: lote_p20, max: lote_p70, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, nombre);
app.setLoadingMode(false);


 }// este viene del esle

} //1
    
  var map_indice_l8 = function(indice_seleccionado) { //1

var indice = ee.Image();

if (indice_seleccionado == "NDVI"){
    coleccion = coleccion.map (function(image) {
  indice = image.normalizedDifference(['B5', 'B4']).rename('NDVI'); 
  return image.addBands(indice);
  });
 }

if (indice_seleccionado == "NDWI"){
   print("hasta aca llegue")
  coleccion = coleccion.map (function(image) {
  var indice = (image.select("B5").subtract(image.select("B6"))).divide(image.select("B5").add(image.select("B6"))).rename('NDWI'); 
  return image.addBands(indice);
  });
}



if (indice_seleccionado == "EVI"){
  coleccion = coleccion.map (function(image) {
  var indice = ((image.select("B5").subtract(image.select("B4"))).divide(image.select("B5").add((image.select("B4").multiply(6)).subtract((image.select("B2").multiply(7.5)).add(1)))).multiply(2.5)).rename("EVI"); 
  return image.addBands(indice);
  });
}

if (indice_seleccionado == "MSI"){
  coleccion = coleccion.map (function(image) {
  var indice = ((image.select("B5").divide(image.select("B6")))).rename("MSI") 
  return image.addBands(indice);
  });
}

if (indice_seleccionado == "MSAVI2"){
  coleccion = coleccion.map (function(image) {
  var indice = (image.select("B5").multiply(2).add(1).subtract(image.select("B5").multiply(2).add(1).pow(2).subtract(image.select("B5").subtract(image.select("B4")).multiply(8)).sqrt()).divide(2)).rename('MSAVI2') 
  return image.addBands(indice);
  });
 }



var coleccion1 = coleccion.map(function(image) {
    var cloud = image.select(indice_seleccionado);
    var cloudiness2 = cloud.reduceRegion({
    reducer: 'mean', 
    geometry: poligono_lote, 
    scale: 10,
  });
  return image.set(cloudiness2);
});



var umbralcete = ee.Number.parse(app.media.umbral.getValue())
//var umbralcete1 = (umbralcete.getInfo())
var coleccion1 = coleccion1.filter(ee.Filter.gt(indice_seleccionado, umbralcete));
print(coleccion1.size().getInfo() < 2)

if (coleccion1.size().getInfo() < 2) {panel_auxiliar.clear(), panel_auxiliar.add(ui.Label("No hay imagenes, seleccione un umbral mas bajo", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))}
else {


var mean = coleccion1.select(indice_seleccionado).mean();
var lote_historico = mean.clip(poligono_lote);

print(lote_historico)
var p90_lote = ee.Number(lote_historico.reduceRegion({
        reducer: ee.Reducer.percentile([90]),
        geometry: poligono_lote,
        maxPixels: 1e9,
        scale: 10,
        }).get(indice_seleccionado));
        
var p10_lote = ee.Number(lote_historico.reduceRegion({
        reducer: ee.Reducer.percentile([10]),
        geometry: poligono_lote,
        maxPixels: 1e9,
        scale: 10,
        }).get(indice_seleccionado));


var lote_p70 = p90_lote.getInfo();
var lote_p20 = p10_lote.getInfo();
var nombre_imagen= ee.String(indice_seleccionado).cat(ee.String(" medio"))
var nombre = nombre_imagen.getInfo()

var regionJSON = JSON.stringify(poligono_lote.getInfo());
var parametros = {'name': indice_seleccionado + "_medio",
        'scale': 10,
        "region": regionJSON }
     
      var url_indice = lote_historico.getDownloadURL(parametros);
      app.media.descarga3.setUrl(url_indice);


 var min_2 = Math.round(lote_p20*100)/100;
    var max_2 = Math.round(lote_p70*100)/100;
     
    graficar_escala(min_2,max_2) 


Map.addLayer(lote_historico,{'bands': [indice_seleccionado],min: lote_p20, max: lote_p70, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, nombre);
app.setLoadingMode(false);


 }// este viene del esle

}; //1
    
  
  
  
  app.media = {
    label1: ui.Label('4) Valor medio', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a"}),
    umbral: ui.Textbox("valor umbral"),
    label2: ui.Label('Calcula el valor promedio del indice seleccionado en el paso previo para las imagenes ingresadas al filtro, valores medios  inferiores al valor umbral son omitidos del calculo (Ingrese -99 para obiar filtro)', {fontWeight: 'bold', color: "white", backgroundColor: "#35373a",textAlign: "justify"}),
    descarga3: ui.Label("Descarga imagen media", {fontWeight: 'bold', color: "white",padding: '10px 10px 10px 10px', fontSize: '15px', backgroundColor: "#F3EBE9", border: "thick double #312D2C"}),
    
    calculo_media: ui.Button({
    label: 'Calcular',
    onClick: function() {
      
       var indice_elegido = app.vis.select_indices.getValue();
       var estado_umbral = app.media.umbral.getValue() !== undefined;
       var estado2 = indice_elegido !== null 
      
       if (estado2 === true) {
         if (estado_umbral === true) {
       if (que_satelite === false) {panel_auxiliar.clear(), map_indice_s2(indice_elegido)}
       if (que_satelite === true) {panel_auxiliar.clear(), map_indice_l8(indice_elegido)}
             } else {
          panel_auxiliar.clear()
          panel_auxiliar.add(ui.Label("Indique valor umbral", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))
             }
        } else {
          
          panel_auxiliar.clear()
          panel_auxiliar.add(ui.Label("No hay indice seleccionado", {fontWeight: 'bold', color: "red", backgroundColor: "#35373a",textAlign: "justify"}))
          
          }
       }
     })
  }
  
  app.media.descarga3.setUrl("https://code.earthengine.google.com/");
  //app.media.calculo_media.setDisabled(false);
  
  app.media.panel = ui.Panel({
     widgets: [ //1
    app.media.label1,
    ui.Panel({//2
        widgets: [
    app.media.umbral,
    app.media.calculo_media,
    ],
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
    layout: ui.Panel.Layout.flow('horizontal'),
    }),//2
    ui.Panel({widgets: [
      app.media.label2,
      app.media.descarga3,
      ],
    style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
    layout: ui.Panel.Layout.flow('vertical'),  
    }),
    
    
    ], //1
     style: {fontWeight: 'bold', color: "black", backgroundColor: "#35373a"},
 
  });
  
  // funciones para generar la escala
  

var panel_auxiliar2 =  ui.Panel({
  widgets: [
    ],
    style: {width: '230px', position: 'bottom-left', fontWeight: 'bold',fontSize: '15px',color: "white", backgroundColor: "#35373a" },
    layout: ui.Panel.Layout.flow('vertical'),
    })

Map.add(panel_auxiliar2)

var estilo_leyenda = {
  backgroundColor: "#35373a", 
  fontSize: '20px',
  fontWeight: 'bold',
  stretch: 'horizontal',
  textAlign: 'center',
  margin: '4px',
};

var estilo_imagen = {
  min: 0,
  backgroundColor: "#35373a",
  max: 1,
  palette: ["FFFFFF", "CE7E45", "DF923D", "F1B555", "FCD163", "99B718", "74A901", "66A000", "529400", "3E8601", "207401", "056201", "004C00", "023B01", "012E01", "011D01", "011301"]
};


function ColorBar(palette) {
  return ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '100x10',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    },
    style: {stretch: 'horizontal', margin: '0px 0px', backgroundColor: "#35373a", color: "white"},
  });
}

function leyenda(valor_inicial, valor_final) {
  var labelPanel = ui.Panel({
      widgets: [
        ui.Label(valor_inicial, {margin: '4px 8px', backgroundColor: "#35373a"}),
        ui.Label(valor_final, {margin: '4px 8px',stretch: "horizontal", textAlign: "right", backgroundColor: "#35373a" })
      ],
      style: {backgroundColor: "#35373a", color: "white"},
      layout: ui.Panel.Layout.flow('horizontal'),
      });
  return ui.Panel([ColorBar(estilo_imagen.palette), labelPanel]);
}

function graficar_escala(valor_inicial, valor_final) {
panel_auxiliar2.clear()
//panel_auxiliar2.add(ui.Label("Leyenda", estilo_leyenda))
panel_auxiliar2.add(leyenda(valor_inicial,valor_final))
  
    }
  }; 
  


/** funciones necasaria pa q ande :-)  */
app.createHelpers = function() {
  /**
   * Enables or disables loading mode.
   * @param {boolean} enabled Whether loading mode is enabled.
   */
  app.setLoadingMode = function(enabled) {
    // Set the loading label visibility to the enabled mode.
    app.filters.loadingLabel.style().set('shown', enabled);
    if (enabled === true) {Map.add(panel_auxiliar3)}
    if (enabled === false) {Map.remove(panel_auxiliar3)}
    // Set each of the widgets to the given enabled mode.
    var loadDependentWidgets = [
      app.vis.select,
      app.filters.startDate,
      app.filters.endDate,
      app.filters.applyButton,
      app.filters.mapCenter,
      app.filters.landsat8,
      app.picker.select,
      app.picker.centerButton,
      app.media.calculo_media,
      app.vis.calcular_indices,
      //app.export2.button
     
    ];
    loadDependentWidgets.forEach(function(widget) {
      widget.setDisabled(enabled);
    });
  };

  /** aplicar los filtros ingresados a la imagen. */
  app.applyFilters = function() {
    

    Map.centerObject(poligono_lote, 14);
    app.setLoadingMode(true);
    que_satelite = app.filters.landsat8.getValue();
    app.select_VIS();
    var satelite = app.filters.landsat8.getValue();
      if (satelite === true) {
      app.COLLECTION_ID = 'LANDSAT/LC08/C01/T1_RT_TOA';
      }
    else {
    app.COLLECTION_ID = 'COPERNICUS/S2';
    }
    
    var filtered = ee.ImageCollection(app.COLLECTION_ID)
    .filterBounds(poligono_lote);
    
    
    // filtrar limites si el la opcion esta dada de alta
    if (app.filters.mapCenter.getValue()) {
      filtered = filtered.filterBounds(Map.getCenter());
    }
    
    //ya aca las imagenes estan filtradas.....
    
    
    
    // variables ingresadas a los filtros
    var start = app.filters.startDate.getValue();
    if (start) start = ee.Date(start);
    var end = app.filters.endDate.getValue();
    if (end) end = ee.Date(end);
    if (start) filtered = filtered.filterDate(start, end);
    
    var agregar_nubes = function(image) {
    var meanDict = image.reduceRegion({
    reducer: ee.Reducer.anyNonZero(),
    geometry: poligono_lote,
    scale: 10,
    maxPixels: 1e9
    });
    return image.set("mascara",meanDict.get("QA60"));
    };
    
    
    var agregar_nubes_L8 = function(image) {
    var qa = image.select('BQA');  
    var mask = qa.bitwiseAnd(1 << 4).eq(0);
    var nubes = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: poligono_lote,
    scale: 10,
    maxPixels: 1e9
    });
    return image.set("mascara",nubes.get("BQA"));
    };
    
    
    
    if (que_satelite === false && app.filters.filtrar_nubes.getValue() === true) {
    print("si pasa")
    filtered = filtered.map(agregar_nubes);
    filtered = filtered.filterMetadata('mascara', 'equals', 0);
    }
    
    print(filtered)
    
     if (que_satelite === true && app.filters.filtrar_nubes.getValue() === true) {
    print("si pasa L8")
    filtered = filtered.map(agregar_nubes_L8);
    print(filtered)
    filtered = filtered.filterMetadata('mascara', 'less_than', 5000);
    }
    
    
    
    coleccion = filtered;
    print(filtered.size())
     var texto = ee.String(filtered.size()).cat(" imagenes disponibles")
     app.picker.nro_imagenes.setValue(texto.getInfo());
    
       

    // calcular todas las imagenes disponibles
    var computedIds = filtered
        .limit(app.IMAGE_COUNT_LIMIT)
        .reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');
    
   //computedIds, es la lista que va al picker.
    
    
    computedIds.evaluate(function(ids) {
      // actualizar los ids para su posterior seleccion. 
      app.setLoadingMode(false);
      app.picker.select.items().reset(ids);
      // se selecciona la primera imagen por default
      app.picker.select.setValue(app.picker.select.items().get(0));
    });
  };

  /** Refreshes the current map layer based on the UI widget states. */
  app.refreshMapLayer = function() {
    //Map.clear();
    //app.setLoadingMode(true);
    var imageId = app.picker.select.getValue();
    print(imageId)
    
    if (imageId) {
      // si una imagen es encontrada, se grafica
      var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
      // se agrega con la correspondiente visualizacion
      
    var params = image.reduceRegion({
    reducer: ee.Reducer.percentile([5, 95]), 
    geometry: poligono_lote, 
    scale: Map.getScale(),
       });
    
      var cuales = app.vis.select.getValue()
      
      if (cuales == "Color Natural S2 (B4/B3/B2)") {
      var visParams = {
          bands: ['B4', 'B3', 'B2'], 
          min: [
         params.get('B4_p5').getInfo(), params.get('B3_p5').getInfo(), params.get('B2_p5').getInfo()
            ],
            max: [
            params.get('B4_p95').getInfo(), params.get('B3_p95').getInfo(), params.get('B2_p95').getInfo()
               ]
            };
      
      }
      
       if (cuales == "Falso color infrarrojo S2 (B8/B4/B3)") {
      var visParams = {
          bands: ['B8', 'B4', 'B3'], 
          min: [
         params.get('B8_p5').getInfo(), params.get('B4_p5').getInfo(), params.get('B3_p5').getInfo()
            ],
            max: [
            params.get('B8_p95').getInfo(), params.get('B4_p95').getInfo(), params.get('B3_p95').getInfo()
               ]
            };
      
      }
      
       if (cuales == "Agricultura S2 (B11/B8A/B2)") {
      var visParams = {
          bands: ['B11', 'B8A', 'B2'], 
          min: [
         params.get('B11_p5').getInfo(), params.get('B8A_p5').getInfo(), params.get('B2_p5').getInfo()
            ],
            max: [
            params.get('B11_p95').getInfo(), params.get('B8A_p95').getInfo(), params.get('B2_p95').getInfo()
               ]
            };
      
      }
      
      
       if (cuales == 'Color Natural L8 (B4/B3/B2)') {
      var visParams = {
          bands: ['B4', 'B3', 'B2'], 
          min: [
         params.get('B4_p5').getInfo(), params.get('B3_p5').getInfo(), params.get('B2_p5').getInfo()
            ],
            max: [
            params.get('B4_p95').getInfo(), params.get('B3_p95').getInfo(), params.get('B2_p95').getInfo()
               ]
            };
      
      }
      
      if (cuales == 'False color infrarrojo L8 (B5/B4/B3)') {
      var visParams = {
          bands: ['B5', 'B4', 'B3'], 
          min: [
         params.get('B5_p5').getInfo(), params.get('B4_p5').getInfo(), params.get('B3_p5').getInfo()
            ],
            max: [
            params.get('B5_p95').getInfo(), params.get('B4_p95').getInfo(), params.get('B3_p95').getInfo()
               ]
            };
      
      }
      
       if (cuales == 'Agricultura L8 (B6/B5/B2)') {
      var visParams = {
          bands: ['B6', 'B5', 'B2'], 
          min: [
         params.get('B6_p5').getInfo(), params.get('B5_p5').getInfo(), params.get('B2_p5').getInfo()
            ],
            max: [
            params.get('B6_p95').getInfo(), params.get('B5_p95').getInfo(), params.get('B2_p95').getInfo()
               ]
            };
      
      }
      
      
        Map.addLayer(image, visParams,imageId);
      
      var regionJSON = JSON.stringify(poligono_lote.getInfo());
      var image1 = image.clip(poligono_lote)
      
      
      var parametros = {'name': imageId,
        'scale': 10,
        "region": regionJSON }
      
      var url = image1.getDownloadURL(parametros);
      app.vis.descarga1.setUrl(url);
      //app.setLoadingMode(false);
      }
    };
};


  
/** Otras constantes. */
app.createConstants = function() {
  
  
  if (que_satelite === false) {
    app.COLLECTION_ID = 'COPERNICUS/S2';
   
  }  
  else {
    app.COLLECTION_ID ='LANDSAT/LC08/C01/T1_RT_TOA';
  
  } 
    
  
  app.SECTION_STYLE = {margin: '10px 0 0 0', color: "black", backgroundColor: "#35373a"};
  app.estilo = {color: "white", backgroundColor: "#35373a"};
  app.HELPER_TEXT_STYLE = {
      margin: '8px 0 -3px 8px',
      fontSize: '16px',
      color: 'white',
      backgroundColor: "#35373a",
  };
  
  app.IMAGE_COUNT_LIMIT = 60;
  
  app.VIS_OPTIONS_S2 = {
      'Color Natural S2 (B4/B3/B2)': {
      description: 'Apariencia similar a la del ojo humano ',
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B4', 'B3', 'B2']}
    },
    'Falso color infrarrojo S2 (B8/B4/B3)': {
      description: 'Vegetaciones en roja, zonas urbanas  ' +
                   'en azul claro, y suelos en marron.',
      visParams: {bands: ['B5', 'B4', 'B3'],min:200, max:9000}
    },
    
    'Agricultura S2 (B11/B8A/B2)': {
      description: 'Vegetacion sana en tonos de verde, tierra arrada ' +
                   'o sin cultivo en colores magenta',
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B11', 'B8A', 'B2']}
     }
  }; 

  app.VIS_OPTIONS_L8 = {
            'Color Natural L8 (B4/B3/B2)': {
            description: 'Apariencia similar a la del ojo humano ',
             
  visParams: {gamma: 1.3, min: 0.1, max: 0.3, bands: ['B4', 'B3', 'B2']}
   },
  'False color infrarrojo L8 (B5/B4/B3)': {
   description: 'Vegetaciones en roja, zonas urbanas  ' +
                'en azul claro, y suelos en marron.',
  visParams: {bands: ['B5', 'B4', 'B3'],min:0.1, max:0.3}
  },
  
  'Agricultura L8 (B6/B5/B2)': {
    description: 'Vegetacion sana en tonos de verde, tierra arrada ' +
                'o sin cultivo en colores magenta',
  visParams: {gamma: 1.3, min: 0.1, max: 0.3, bands: ['B6', 'B5', 'B2']}
  }
 }; 
 app.VIS_OPTIONS = app.VIS_OPTIONS_S2;
};


/** Interfaz. */
app.boot = function() {
  app.createConstants();
  app.createHelpers();
  app.createPanels();
  var main = ui.Panel({
    widgets: [
      app.intro.panel,
      app.filters.panel,
      app.picker.panel,
      app.vis.panel,
      app.media.panel,
    ],
    style: {width: '320px', padding: '8px', color: "white", backgroundColor: "#35373a"}
  });
 
 
 Map.centerObject(poligono_lote, 14);
 
  ui.root.insert(0, main);
  };


app.boot();
