// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: server;
// CONFIGURATION //

//Alle Widget parameter:

// de | Inzidenz für Deutschland

// geo | Inzidenz der aktuellen Position

// lk <name> / sk <name> | Inzidenz für bestimmten Land- oder Stadtkreis


// PARAM TEMPLATE
// ort=de; maxdays=10;

//zeigt Datum
let showDate = true 

//zeigt Pfeil
let showTrend = true 

//zeigt Ortsnamen
let showLoc = true 

// spart Daten und verhindert offline Screen
let refreshDaily = true

// uhrzeit für die tägliche Aktualisierung
let refreshTime = 6

//Voreingestellter Parameter
let apiParam = "de"

//helle Hintergrundgarbe
let light = Color.white()

//dunkle Hintergrundfarbe
let dark = new Color("#212121") 

//Zeigt bei bestimmtem Verhalten der Inzidenz andere Symbole oder anderen Text
let special = true

//DIAGRAMM
// zeigt Diagram im medium Widget
let showDiagram = true

//maximal angezeigte Tage
//(0 für automatische Anzeige)
let maxShow = 60

//Abrundung der Säulen 
//(Nicht im automatischen modus)
let rounding = 1

//zeigt Tage unter dem Diagramm
//(Das Datum wird dabei ausgeblendet)
let showDays = true



const DEBUG_WIDGET = true

//SCRIPT BEGINNT AB HIER//
//Vorsicht beim bearbeiten

let version = 2.9

let updateUrl = "https://google.com"
let downloadUrl = "https://raw.githubusercontent.com/better-iServ/iServ-Client/main/updates/updateVersion.txt"

// 
// await updateScript() // 
// return

//CHECK WIDGETPARAMS
if(config.runsInWidget) 
{ 
    if(args.widgetParameter != "")
    { if(args.widgetParameter != null) 
      apiParam = getParam(args.widgetParameter, "ort", apiParam)
      maxShow = getParam(args.widgetParameter, "maxdays", maxShow)
      rounding = getParam(args.widgetParameter, "rounding", rounding)
    }
}
//CHECK QUERY PARAMETERS
if(args.queryParameters.param != undefined)
  {
    if(args.queryParameters.param == "update")
    {
      await updateScript() 
      return
   }
    else
      apiParam = args.queryParameters.param
  }
  

let bigWidget = false


let ort 

let nameUrl = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=county%20%3D%20'" + encodeURIComponent(apiParam.toUpperCase()) + "'&outFields=*&outSR=4326&f=json"

let fontColor = Color.dynamic(Color.black(), Color.white())
let bg = Color.dynamic(light, dark)

let firstTime = false
let trendPossible = true
let showGeostack = false

let max = maxShow




//CHECK IF ONLINE
try
{
  let r = await new Request(nameUrl).loadJSON()
}
catch (e)
{
  if(config.runsInWidget)
   Script.setWidget(offline())
  else
   offline().presentSmall()
   return
}

//CHECK IF LOCATION EXCISTS
if(apiParam == "geo" || apiParam == "de")
  log("special param used")
else
{
try
{
    let r = await new Request(nameUrl).loadString()
  let j = await JSON.parse(r)
  let d = j.features[0].attributes.cases7_per_100k_txt
     
}
catch (e)
{
    log(e)
    if(config.runsInWidget)
     Script.setWidget(notfound())
    else
     notfound().presentSmall()
    return
    }
}


//CHECK UPDATE

  let upReq = new Request(updateUrl)
  let upVer = await upReq.loadString()
  let upVerFl = parseFloat(upVer)
  upVerFl = 3.1
  if(upVerFl > version)
  {
      let fmUp = FileManager.iCloud()
  let dirPathUp = fmUp.documentsDirectory()
  if (!fmUp.fileExists(fmUp.joinPath(dirPathUp, "Inzidenz Widget v" + upVerFl + ".js")))   
  {
  
    if(config.runsInWidget)
    {
       Script.setWidget(update(upVerFl))
      return
    }
    else
    {
       update(upVerFl).presentSmall()
       return
    }
  }
  else
  {
    if(config.runsInWidget)
    {
       Script.setWidget(newer(upVerFl))
      return
    }
    else
    {
       newer(upVerFl).presentSmall()
       return
    }  
  }
}

if(config.widgetFamily == "medium")
  bigWidget = showDiagram

//PRESENT WIDGET
if (config.runsInWidget) {
    Script.setWidget(await createWidget())
} 
else 
{
  if(DEBUG_WIDGET)
  {
    //bigWidget = showDiagram;  
(await createWidget()).presentSmall()
 }
else
{
 (await createUI()).present(true)
}
  

}
    

async function createWidget()
{ 
    let w = new ListWidget()
    w.backgroundColor = bg
    w.url = URLScheme.forRunningScript() + "?param=" + encodeURIComponent(apiParam)
    log(w.url)
    let inz = await getInzidenz();
    inz = inz.inz
    
    let t
    
    if(trendPossible)
    {
     setTrend(inz)
     t = getTrend(inz)
    }
    else{
      showTrend = false
    }
    
    
    if(showLoc)
    {
      let header = w.addText(ort)
      if(!bigWidget)
         header.minimumScaleFactor = 0.1
      header.font = Font.boldSystemFont(18)
      w.addSpacer(10)
  }
    if(showGeostack)
    {
      let geostack = w.addStack()
      let icon = SFSymbol.named("location.fill")
      icon.applyFont(Font.systemFont(50))
       let te = geostack.addText(ort)
       te.font = Font.boldSystemFont(18)
       if(!bigWidget)
          te.minimumScaleFactor = 0.1
       geostack.centerAlignContent()
       geostack.addSpacer(5)
       let im = geostack.addImage(icon.image)
       im.imageSize = new Size(14, 14)
       im.tintColor = fontColor
   
    
    }
    let inzStack = w.addStack()
    inzStack.centerAlignContent()
    
    
    let inzText = inzStack.addText(inz)  
    inzText.font = Font.boldSystemFont(setFontSize(inz))
    

    if(showTrend)
    {
      inzStack.addSpacer(10)
      
      if(t.icon != null)
      {
        let arrow = inzStack.addImage(t.icon.image)  
        arrow.imageSize = new Size(28, 28)
        arrow.tintColor = t.color
      }
        
      
      if(bigWidget)
      {
        
        inzStack.addSpacer(25)
        let c = inzStack.addStack()
        c.centerAlignContent()
        c.layoutVertically()
        let img = c.addImage(diagram(300))
        img.imageSize = new Size(150, 50)
        if(showDays)
        {
          showDate = false
          let days 
          let data = getData().inz
          if(data.length > max)
           days = max.toString()
          else
            days = (data.length).toString()
          c.addSpacer(5)
          let t = c.addText("Verlauf seit " + days + " Tagen") 
          t.font = Font.systemFont(12)
          t.minimumScaleFactor = 0.9
          
        } 
      }
  
      
      let desText = w.addText(t.text)
      desText.textColor = t.color
      desText.font = Font.mediumRoundedSystemFont(15)
      if(!bigWidget)
        desText.minimumScaleFactor = 0.2

    }
    if(showDate)
    {
      w.addSpacer(7)
      let date = new Date()
      let dtString = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear()
      log(dtString)
      let dateText = w.addText(dtString)
      dateText.font = Font.systemFont(15)
      dateText.textOpacity = 0.5
   }
  
  if(ort == "errL")
  {
    return locationFailed()  
  }
  
  if(refreshDaily)
  {
    if(apiParam == "geo")
      return w
    let d = new Date()  
    d.setHours(refreshTime)  
    d.setMinutes(0)  
    d.setSeconds(0)  
    d.setMilliseconds(0)  
    d.setDate(d.getDate() + 1)
    w.refreshAfterDate = d
  }
  
    
  if(ort == "errD")
    return dataFailed()
    
  return w
}

async function createUI()
{
  let inz = await getInzidenz()
  let data = inz.rawData
  setTrend(inz.inz)
  let trend = getTrend(inz.inz)
  inz = inz.inz;
  maxShow = 30;
  max = 30;
  rounding = 4

  let days 
          
  let d = getData().inz
  if(d.length > max)
     days = max.toString()
  else
     days = (d.length).toString()
  
  
  let cas7lk
  let caslk
  let death7
  let death
  if(apiParam == "de")
  {
    cas7lk = data.features[0].attributes.AnzFall7T
    caslk = data.features[0].attributes.AnzFall

  }
  else
  {
    cas7lk = data.features[0].attributes.cases7_lk
    caslk = data.features[0].attributes.cases
}
  let ui = new UITable()
  let header = new UITableRow()
  let h = header.addText(ort, "Covid-19 Statistiken")
  h.centerAligned()
  h.titleFont = Font.boldSystemFont(30)
  header.height = 70
  let row = new UITableRow()
  
  let inzidenz = row.addText("Inzidenz", inz.toString())
  inzidenz.titleFont = Font.systemFont(20)
  inzidenz.subtitleFont = Font.boldSystemFont(35)
  inzidenz.centerAligned()
  row.height = 100
  
  let cases = row.addText("Fälle (7 Tage)", cas7lk.toString())
  cases.titleFont = Font.systemFont(20)
  cases.subtitleFont = Font.boldSystemFont(35)
  cases.centerAligned()
  
  let casesAll = row.addText("Fälle", caslk.toString())
    casesAll.titleFont = Font.systemFont(20)
  casesAll.subtitleFont = Font.boldSystemFont(35)
  casesAll.centerAligned()
  
let row1 = new UITableRow()


let row2 = new UITableRow()


let imgDesRow = new UITableRow()
let des = imgDesRow.addText("Inzidenzverlauf", "seit " + days + " Tagen")
des.centerAligned()
des.titleFont = Font.systemFont(20)

let img = row2.addImage(diagram(600))
row2.height = 70
img.centerAligned()

let row3 = new UITableRow()
let trendText = row3.addText(trend.text)
trendText.titleColor = trend.color
trendText.centerAligned()

let footer = new UITableRow()
let btn = footer.addButton("Zum RKI-Dashboard")
btn.centerAligned()

btn.onTap = () => {
  Safari.openInApp("https://google.com", true)
}
    
  let spacer = new UITableRow()
  
   
  ui.addRow(header)
  ui.addRow(spacer)
  ui.addRow(row)
  ui.addRow(spacer)
  ui.addRow(imgDesRow)
  ui.addRow(row2)
  ui.addRow(row3)
  ui.addRow(spacer)
  ui.addRow(footer)
  return ui
}

function getTrend(inz)
{
  if(!trendPossible)
    return
    
  let fm = FileManager.iCloud()
  let path = getFilePath()
  fm.downloadFileFromiCloud(path)
 
  
  let date = new Date()
  
  let last = fm.readString(path)
  
  let dif = undefined
  
  last = JSON.parse(last)
  let json = last
      
  
  let mod = last.data[last.data.length - 2].date

  mod = new Date(mod)
  let delta = date.getTime() - mod.getTime()
  
  if(last.data.length != 1)
  {
    last = last.data[last.data.length - 2].inz
 
    dif = parseFloat(inz.replace(",", ".")) - parseFloat(last.replace(",", "."))  
    dif = dif.toFixed(1)
    if(dif > 0)
    {
      dif = "+" + dif.toString()
    }
    else
    {
      dif = dif.toString()
    }
    last = parseFloat(last.replace(",", "."))
  }
  else 
  {
     last = undefined
     showTrend = false
  }
  inz = parseFloat(inz.replace(",", "."))
  let s = null
  let t = "Covid-19 Inzidenz"
  let c = Color.white()
 
  
  
  if(inz > last)
  {
      s = SFSymbol.named("arrow.up.circle")
      t = dif
      c = Color.red() 
//       if(dif <= 2.5)
//       {
//         s = SFSymbol.named("arrow.up.forward.circle.fill")
//         
//      }
  }
  else if(inz < last)
  {
      s = SFSymbol.named("arrow.down.circle")
      t = dif
      c = Color.green() 
//       if(dif >= -2.5)
//       {
//        s = SFSymbol.named("arrow.down.forward.circle.fill")
//        
//      }
  }
  else if(inz == last)
  {
    t = "keine Änderung"  
    s = SFSymbol.named("arrow.forward.circle")
    c = fontColor
  }
 
  //if(dif <= 1)
   //c = Color.orange()
  let all = []
  for(let i = 0; i < json.data.length; i++)
  {
    all.push(parseFloat((json.data[i].inz).replace(",", ".")))
  }
  
  if(s != null)
    s.applyFont(Font.systemFont(50))
    
  if(delta/3600000 > 48)
  {
   if(s != null)
    {
       t = t + " seit " + mod.getDate() + "." + (mod.getMonth() + 1)
    }
    let r = {"icon":s, "text":t, "color":c}
    return r
 }
  
  if(!special)
  {
      let r = {"icon":s, "text":t, "color":c}
      return r  
  }
  
  
   
 
   if(Math.abs(dif) < 5)
  {
    showDate = false
    s = SFSymbol.named("arrow.up.arrow.down.circle")
    t = t + " | wenig Änderung"
  }
  
  
  if(Math.abs(dif) > 25)
  {
    showDate = false
    if(dif > 0)
    {
       s = SFSymbol.named("exclamationmark.triangle")
       t = t + " | starker Anstieg"
    }
    else
    {
      s = SFSymbol.named("checkmark.circle")
       t = t + " | stark gesunken"
    }
  }
  
  
  if(Math.max(...all) == inz)
  {
    showDate = false
    s = SFSymbol.named("exclamationmark.triangle")
    t = t + " | höchster Wert"
 }
  
  if(Math.min(...all) == inz)
  {
    showDate = false
    s = SFSymbol.named("checkmark.circle")
    t = t + " | niedrigster Wert"
 }
  
  let r = {"icon":s, "text":t, "color":c}
  
  return r


}

function setTrend(inz)
{  
  if(!trendPossible)
    return
  let fm = FileManager.iCloud()
  let path = getFilePath()
  fm.downloadFileFromiCloud(path)
  
    let mod = fm.modificationDate(path)

  mod = new Date(mod)
  
  let date = new Date()
  

  if(!firstTime)
    if(mod.toString().split(" ")[2] == Date().split(" ")[2])
       return 
   
  if(!firstTime && date.getHours() < 5)
   return

  let last = fm.readString(path)
  last = JSON.parse(last)
  
  let data = {"inz":inz, "date":date.toISOString()}
  last.data.push(data)
  
  
  fm.writeString(path, JSON.stringify(last))

}

function getData()
{
  let fm = FileManager.iCloud()
  let path = getFilePath()
  
  let last = fm.readString(path)
  
  last = JSON.parse(last)
  let arr = []
  let dates = []
  for(let i = 0; i < last.data.length; i++)
  {
    let str = last.data[i].inz
    let date = last.data[i].date
    str = str.replace(",", ".")
    let float = parseFloat(str)
    
    dates.push(date)
    arr.push(float)
  }
  let dicionary = {"inz":arr, "dates":dates}
  return dicionary
}

async function getInzidenz()
{
    let inzidenz
    let raw 
    if(apiParam == "geo")
    {
      showLoc = false
      showGeostack = true
      try{
        await kreisRequest(await getGeoUrl())
       }
      catch (e)
      {
        trendPossible = false
        if(inzidenz == undefined)
        {
           inzidenz = ""
           ort = "errL"

        }
        
      }
    }
    else if(apiParam.split(" ")[0] == "bl")
    {
      
    }
    else if(apiParam.split(" ")[0] == "lk" || apiParam.split(" ")[0] == "sk")
    {
      try{
          await kreisRequest(getNameUrl(apiParam))
       }
      catch (e)
      {
        if(inzidenz == undefined)
        {
           inzidenz = ""
           ort = "errD"
           trendPossible = false

        }
        
      }
    }
    else if(apiParam == "de")
    {
      try
      {
          ort = "Deutschland"
          await bundesRequest()
     }
      catch (e)
      {
        trendPossible = false
        if(inzidenz == undefined)
        {
           inzidenz = ""
           ort = "Fehler beim Abrufen der Daten"

        }   
      }
    }
    
    async function kreisRequest(url)
    {
      let jsonData = await request(url)
      raw = jsonData
      inzidenz = jsonData.features[0].attributes.cases7_per_100k_txt
    ort = jsonData.features[0].attributes.county 
    log(ort)
    ort = ort.split(" ")[1]
    }
    
    
    async function bundesRequest()
    {
      let url = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_hubv/FeatureServer/0/query?where=%20(BundeslandId%20%3D%200%20OR%20BundeslandId%20%3D%200)%20&outFields=*&outSR=4326&f=json"
      
      let jsonData = await request(url)
      inzidenz = jsonData.features[0].attributes.Inz7T;    raw = jsonData
      inzidenz = inzidenz.toString()
      inzidenz = inzidenz.replace(".", ",")
    }
   
  
   function getNameUrl(name)
  {
    let nameUrl = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=county%20%3D%20'" + encodeURIComponent(name.toUpperCase()) + "'&outFields=*&outSR=4326&f=json"
    return nameUrl
  }
  
  async function getGeoUrl()
  {
    let location
        location = await Location.current()
    let geoUrl = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`
   return geoUrl
  
  }
   
  return {"inz":inzidenz, "rawData":raw};
}

async function request(url)
{  
  let request = new Request(url)
  request.method = "GET"
  let data = await request.loadString() 
  let JsonData = JSON.parse(data)
  
  //log(JsonData)
  return JsonData;

}


function getFilePath() {
  let o = ort.toLowerCase()
  let start_content = {
    data:[]
  }
  let fm = FileManager.iCloud()
  let dirPath = fm.joinPath(
    fm.documentsDirectory(),
    "inzidenz_widget")
  if(!fm.fileExists(dirPath))
    fm.createDirectory(dirPath)
  if (!fm.fileExists(fm.joinPath(dirPath, o + "_inzidenz_log.json"))) {
    fm.writeString(fm.joinPath(dirPath, o + "_inzidenz_log.json"), JSON.stringify(start_content))
    firstTime = true
  }
  return fm.joinPath(
    dirPath,
    o + "_inzidenz_log.json")
}


function offline()
{
  let w = new ListWidget()
  w.backgroundColor = bg
  let icon = SFSymbol.named("wifi.slash")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = Color.red()
 img.centerAlignImage()
 w.addSpacer(10)
 let t = w.addText("Keine Verbindung zum Internet")
t.minimumScaleFactor = 0.1
 t.font = Font.boldSystemFont(14)
t.centerAlignText()
 return w
}

function update(ver)
{
  let w = new ListWidget()
  w.backgroundColor = bg
  w.url = URLScheme.forRunningScript() + "?param=update"
  let icon = SFSymbol.named("icloud.and.arrow.down")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = Color.green()
 img.centerAlignImage()
 
 let t = w.addText("Update verfügbar")
 t.font = Font.boldSystemFont(15)
 t.minimumScaleFactor = 0.1
t.centerAlignText()
w.addSpacer(5)
let des = w.addText("v" + ver + " | Zum Installieren tippen")
des.font = Font.systemFont(12)
des.centerAlignText()
des.minimumScaleFactor = 0.1
 return w

 
}

function newer(ver)
{
  let w = new ListWidget()
  w.backgroundColor = bg
  w.url = URLScheme.forRunningScript() + "?param=change"
  let icon = SFSymbol.named("folder")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = Color.green()
 img.centerAlignImage()
 
 let t = w.addText("Es wurde eine neue Version installiert")
 t.font = Font.boldSystemFont(15)
 t.minimumScaleFactor = 0.1
t.centerAlignText()
 return w

 
}


function dataFailed()
{
  let w = new ListWidget()
  w.backgroundColor = bg
  let icon = SFSymbol.named("externaldrive.badge.xmark")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = fontColor
 img.centerAlignImage()
 w.addSpacer(10)
 let t = w.addText("Fehler")
//  t.textColor = Color.red()
 t.font = Font.boldSystemFont(14)
t.centerAlignText()
 return w
}

function locationFailed()
{
  let w = new ListWidget()
  w.backgroundColor = bg
  let icon = SFSymbol.named("location.slash")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = Color.red()
 img.centerAlignImage()
 w.addSpacer(10)
 let t = w.addText("Abrufen des Standorts Fehlgeschlagen")
//  t.textColor = Color.red()
 t.font = Font.boldSystemFont(16)
t.centerAlignText()
t.minimumScaleFactor = 0.1

 return w
}

function notfound()
{
  let w = new ListWidget()
  w.backgroundColor = bg
  let icon = SFSymbol.named("exclamationmark.triangle")
 icon.applyFont(Font.systemFont(50))
 let img = w.addImage(icon.image)
 img.imageSize = new Size(48, 48) 
 img.tintColor = Color.red()
 img.centerAlignImage()
 w.addSpacer(10)
 let t = w.addText("Ort nicht gefunden")
//  t.textColor = Color.red()
 t.font = Font.boldSystemFont(16)
t.centerAlignText()
 return w
}

function setFontSize(i)
{
  i = i.split("").length
  if(i >= 5)
   return 25
  else
   return 32
}

function diagram(w)
{
  let rawData = getData()
  let data = rawData.inz
  let dates = rawData.dates
  log(dates)
//   let data = [1, 50, 100, 40, 22, 32, 25, 34, 47, 51, 56, 49, 30, 25, 12, 105, 10]
  let canvasSize = new Size(w, 100)
  
  let canvas = new DrawContext()
  canvas.size = canvasSize
  canvas.opaque = false
  canvas.respectScreenScale = true
  canvas.setFillColor(Color.white())
  
  let pos = 0
  
  let lowDate = new Date(dates[0])

//   let defaultWert = data[data.length - 1] + 0.1234

  let defaultWert = data[0] + 0.1234

  
  if(maxShow == 0)
  {
    if(data.length < 7)
    {
      max = 7
      rounding = 10
    }
    else if(data.length < 14)
    {
      max = 14
      rounding = 5
    }
    else if(data.length < 21)
    {
      max = 21
      rounding = 4
    }
    else if(data.length < 30)
    {
      max = 30
      rounding = 3        
    }
    else
    {
      max = 30
      rounding = 3
  }
  }

//   for(let i = 0; i < max; i++)
//   {
//     let d = new Date(dates[i])
  //log("j" + d.getDate())
  //log(lowDate.getDate())
//     
//     let days = parseInt(d.getDate())
//     let month = parseInt(d.getMonth())
//     
//     if(dates[i] != undefined && d.getDate() != lowDate.getDate())
//     {
//       if(d.getDate() == 01 && d.getMonth() != lowDate.getMonth())
//      {
//         data[i] = data[i]     
//      }
//      else
//      {       
//         let dif = d.getDate() - lowDate.getDate()
//        
//           for(let l = 0; l < dif; l++)
//           {
//             data.splice(i-1, 0, defaultWert)
//           }
//           
//          lowDate.setDate(lowDate.getDate() + dif)
//      }
//       
//    }    
//    lowDate.setDate(lowDate.getDate() + 1)
//     
//   }
  
  
  let blockW = canvasSize.width/(max*2)
  
  if(data.length > max)
  {
    let tmp = []
    let dif = data.length - max
    for(let i = dif; i < data.length; i++)
    {
      tmp.push(data[i])
    }
    data = tmp
    
  } 
  else
  {
    for(let i = 0; i < max; i++)
    {
      if(data[i] == undefined)
      {
        data.push(defaultWert)
        //dates.push(new Date().toISOString())
      }
    }
    
  }
  
  for(let i = 0; i < max; i++)
  {
    let n = data[i]
    let p = new Point(0, 0)
    let path = new Path()
    let height = canvasSize.height*n/Math.max(...data)
    
    path.addRoundedRect(new Rect(pos, canvasSize.height, blockW, -height), rounding, rounding)
 
    canvas.addPath(path)
    if(n == defaultWert)
    {
     canvas.setFillColor(Color.gray())
    }
    else if(n < 25)
    {
      canvas.setFillColor(Color.green())

    }
    else if(n < 50)
    {
      canvas.setFillColor(Color.yellow())
    }
    else if(n < 100)
    {
      canvas.setFillColor(new Color("#ff7605"))
    }
    else if(n < 200)
    {
      canvas.setFillColor(Color.red())
    }
    else if(n < 500)
    {
      canvas.setFillColor(Color.purple())
    }
    else
    {
      canvas.setFillColor(Color.blue())
    }
    canvas.fillPath()
        
    pos += blockW * 2
    
  }
  return canvas.getImage()
}

// function getParam(p, s)
// {
//   let ort = apiParam
//   let maxdays = maxShow
//   let round = rounding
//   
//   try
//   {
//     JSON.parse(p)
//   }
//   catch (e) {}
//   
//   try
//   {
//     let json = JSON.parse(p)
//     ort = json.ort
//   }
//   catch (e) {}
//   
//   try
//   {
//     let json = JSON.parse(p)
//     maxdays = json.maxdays
//   }
//   catch (e) {}
//   
//   try
//   {
//     let json = JSON.parse(p)
//     round = json.rounding
//   }
//   catch (e) {}
//   
//   if(s == "ort")
//   {
//     return ort
//   }
//   else if(s == "maxdays")
//   {
//     return maxdays
//   }
//   else if(s == "rounding")
//   {
//     return round
//   }
//   
//   
// 
// }

function getParam(p, s, def)
{
  
  let parname = s + "="  
  let ca = p.split(';');
  for(let i = 0; i <ca.length; i++)
{
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(parname) == 0) {
      return c.substring(parname.length, c.length);
    }
  }
  return def;
  
  
  

}

async function updateScript()
{
  try
  {
    let upReq = new Request(updateUrl)
    let upVer = await upReq.loadString()
    let upVerFl = parseFloat(upVer)
    if(upVerFl > version)
    {
      let noUp = new Alert()
      noUp.title = "Update installieren"
      noUp.message = "Es ist ein Update des Widgets verfügbar"
      
       noUp.addAction("Abbrechen")
       noUp.addAction("Installieren")
       
       
       let res = await noUp.presentAlert() 
       if(res == 1)
       {
         await loadUpdate() 
       }
     
    }
    else
    {
      let noUp = new Alert()
      noUp.title = "Widget auf dem neusten Stand"
      noUp.message = "Es ist die neuste Version (" + version + ") des Widgets installiert"
       noUp.addAction("Ok")
       await noUp.presentAlert()
    
    }
  }
  catch (e) {log(e)}
  
  
}

async function loadUpdate()
{
  let fileReq = new Request(downloadUrl)
  let file = await fileReq.loadString()
  if((await saveUpdate(upVerFl, file)))
  {
    let noUp = new Alert()
    noUp.title = "Inzidenz Widget v" + upVerFl + " wurde erfolgreich installiert"
    noUp.message = "Jetzt musst du noch im Widget das Script ändern: Widget gedrückt halten > Scriptable bestbeiten' > 'Script' > 'Inzidenz Widget v" + upVerFl + "'"
     noUp.addAction("Ok")
     await noUp.presentAlert()
  
  }
  else
  {
    let noUp = new Alert()
    noUp.title = "Inzidenz Widget v" + upVerFl + " ist bereits installiert"
    noUp.message = "Eventuell musst du noch im Widget das Script ändern: Widget gedrückt halten > Scriptable bestbeiten' > 'Script' > 'Inzidenz Widget v" + upVerFl + "'"
     noUp.addAction("Ok")
     await noUp.presentAlert()
    
  }
  
  
}

function saveUpdate(ver, con) {
  let fm = FileManager.iCloud()
  let dirPath = fm.documentsDirectory()
  if (!fm.fileExists(fm.joinPath(dirPath, "Inzidenz Widget v" + ver + ".js"))) {
  
     fm.writeString(fm.joinPath(dirPath, "Inzidenz Widget v" + ver + ".js"), con)
      return true
  }
  else
  {
    return false
    
 }
}
