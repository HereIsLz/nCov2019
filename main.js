
const __DEBUG = false;
const startDate = new Date(2020, 0, 10);
const endDate = new Date(2020, (new Date()).getMonth(), (new Date()).getDate())
const Theme = {
  backgroundColor: '#f9f9fb',
  secureAccentColor: '#1565c0',

  accentColor: '#d03218',
  sumAccentColor: '#d03218',
  deadAccentColor: '#4527a0',
  curedAccentColor: '#1e9255',
  NoneValueColor: '#70727e',
  ByConfirm_DividedByZeroColor: '#666666',//比例下
  ByConfirm_ZeroColor: '#d03218',

  ConfirmedColor: '#d03218',
  DeadColor: '#4527a0',
  CuredColor: '#1e9255',

  ConfirmedBorderColor: '#881719',
  DeadBorderColor: '#4527a0',
  CuredBorderColor: '#00695c',

  mapBaselineWidth: 0.44,
  mapProvlineWidth: 1.25,
  noneValueOpacity: 0.1,

  svgSize: 32
}

const maxOpacityValue = {
  Confirmed: {
    AccumulatedValue: 8000,
    OriginalValue: 2000,
    ByArea: .8,
    ByPopulation: 15,

    AccumulatedValue_Legend: [10, 50, 100, 300, 500, 1000, 3000, 10000],
    OriginalValue_Legend: [5, 10, 30, 50, 100, 200, 500, 1500],
    ByArea_Legend: [0.001, 0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1.2],
    ByPopulation_Legend: [0.05, 0.1, 0.25, 0.5, 1, 3, 5, 10],

  },
  Dead: {
    AccumulatedValue: 400,
    OriginalValue: 200,
    ByConfirmed: .6,
    ByArea: .2,
    ByPopulation: 1,
    AccumulatedValue_Legend: [1, 5, 10, 30, 50, 100, 300, 500],
    OriginalValue_Legend: [1, 3, 5, 10, 20, 30, 50, 100],
    ByConfirmed_Legend: [0.005, 0.01, 0.025, 0.05, .1, .25, .5, 1],
    ByArea_Legend: [.00001, .00005, .001, .003, .005, .01, .03, .05],
    ByPopulation_Legend: [0.001, 0.005, 0.01, 0.03, .05, .1, .3, 0.5]
  },
  Cured: {
    AccumulatedValue: 200,
    OriginalValue: 100,
    ByConfirmed: 1,
    ByArea: .05,
    ByPopulation: 1,
    AccumulatedValue_Legend: [1, 5, 10, 30, 50, 100, 300, 500],
    OriginalValue_Legend: [1, 3, 5, 10, 20, 30, 50, 100],
    ByConfirmed_Legend: [0.005, 0.01, 0.025, 0.05, .1, .25, .5, 1],
    ByArea_Legend: [.00001, .00005, .001, .003, .005, .01, .03, .05],
    ByPopulation_Legend: [0.001, 0.003, 0.01, 0.03, .05, .1, .3, 0.5],

  }
}


var Dataset = Object;
const json_provinces_arr = ['11', '12', '13', '14', '15', '21', '22', '23', '31', '32', '33', '34', '35', '36', '37', '41', '42', '43', '44', '45', '46', '50', '51', '52', '53', '54', '61', '62', '63', '64', '65', '71', '81', '82']
const json_provinces_provinceName = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'];
var jsonSet = []

const promiseList = json_provinces_arr.map(d => fetchGeoPath(d, 'china-geojson-master/geometryProvince/'));


const projection = d3.geoMercator()
  .center([105, 38])
  .scale(720)
  .translate([420, 290])
const pathMap = d3.geoPath().projection(projection);
const layer1 = d3.select('#layer1')
const layer2 = d3.select('#layer2').attr("opacity", .8)
function DateToConsultString(dt) {
  return (dt.getMonth() + 1) + "月" + dt.getDate() + "日"
}
function fetchData() {
  d3.json('https://tanshaocong.github.io/2019-nCoV/nameDict.json')
    .then(
      function (nameDict) {
        Dataset.nameDict = nameDict
        d3.csv('https://tanshaocong.github.io/2019-nCoV/map.csv').then(function (data) {
          let dataChina = data.filter(d => d['类别'] == '地区级')
          dataChina.forEach(a => {
            a['地图对应地名'] = Dataset.nameDict[a['城市']]
            if ((a['城市'] == 'NA') || (Dataset.nameDict[a['城市']] == 'NA') || (!Dataset.nameDict[a['城市']])) {
              a['地图对应地名'] = Dataset.nameDict[a['省份']]
            }
            a['地图对应省级名'] = Dataset.nameDict[a['省份']]
            if (__DEBUG) {
              if (!Dataset.nameDict[a['省份']]) {
                console.warn('!!! no dict for province', a)
              }
            }
          })
          Dataset.dataChina = dataChina

          let dataByDate = d3.nest().key(d => d['公开时间']).key(d => d['地图对应地名']).rollup(d => ({ 'sum': d3.sum(d, a => a['新增确诊病例']), 'dead': d3.sum(d, a => a['新增死亡数']), 'cured': d3.sum(d, a => a['新增治愈出院数']) })).entries(dataChina)

          Dataset.dataByDate = dataByDate
          let dataAccByDate = []
          let obj = {}
          obj['key'] = 'day -1'
          obj['values'] = []
          dataAccByDate.push(obj)
          for (let i = 0; i < dataByDate.length; i++) {
            let tmp = [dataAccByDate[i], dataByDate[i]]
            let arr = []
            tmp.forEach(d => {
              arr = arr.concat(d['values'])
            })
            let acc = d3.nest().key(d => d['key']).rollup(d => ({
              'sum': d3.sum(d, a => a['value']['sum']),
              'dead': d3.sum(d, a => a['value']['dead']),
              'cured': d3.sum(d, a => a['value']['cured'])
            }))
              .entries(arr)
            let obj = {}
            obj['key'] = dataByDate[i]['key']
            if (__DEBUG)
              if (obj['key'] == 'NA') {
                console.warn('$$$$$$$$$$$$$$$', dataByDate[i])
              }
            obj['values'] = acc
            let accCount = d3.sum(acc, a => a['value']['sum'])
            let count = d3.sum(dataByDate[i]['values'], a => a['value']['sum'])
            obj['count'] = count
            obj['accCount'] = accCount
            dataAccByDate.push(obj)
          }
          dataAccByDate.shift()
          Dataset.dataAccByDate = dataAccByDate
          let dataProvince = data.filter(d => d['类别'] == '省级')
          dataProvince.forEach(a => {
            a['地图对应地名'] = Dataset.nameDict[a['省份']]
            a['地图对应省级名'] = Dataset.nameDict[a['省份']]
            if (__DEBUG) if (!Dataset.nameDict[a['省份']]) {
              console.warn('!!! no dict for province', a)
            }
          })

          let dataProvinceByDate = d3.nest().key(d => d['公开时间']).key(d => d['地图对应地名']).rollup(d => ({ 'sum': d3.sum(d, a => a['新增确诊病例']), 'dead': d3.sum(d, a => a['新增死亡数']), 'cured': d3.sum(d, a => a['新增治愈出院数']) })).entries(dataProvince)

          Dataset.dataProvinceByDate = dataProvinceByDate
          let dataProvinceAccByDate = []
          let objProvince = {}
          objProvince['key'] = 'day -1'
          objProvince['values'] = []
          dataProvinceAccByDate.push(objProvince)
          for (let i = 0; i < dataProvinceByDate.length; i++) {
            let tmp = [dataProvinceAccByDate[i], dataProvinceByDate[i]]

            let arr = []
            tmp.forEach(d => {
              arr = arr.concat(d['values'])
            })
            let acc = d3.nest().key(d => d['key']).rollup(d => ({ 'sum': d3.sum(d, a => a['value']['sum']) })).entries(arr)
            let obj = {}
            obj['key'] = dataProvinceByDate[i]['key']
            obj['values'] = acc
            let accCount = d3.sum(acc, a => a['value']['sum'])
            let count = d3.sum(dataProvinceByDate[i]['values'], a => a['value']['sum'])
            obj['count'] = count
            obj['accCount'] = accCount
            dataProvinceAccByDate.push(obj)
          }
          dataProvinceAccByDate.shift()
          Dataset.dataProvinceAccByDate = dataProvinceAccByDate
          let dataCountry = data.filter(d => d['类别'] == '国家级')
          let dataCountryByDate = d3.nest().key(d => d['公开时间']).rollup(d => ({ 'sum': d3.sum(d, a => a['新增确诊病例']), 'dead': d3.sum(d, a => a['新增死亡数']), 'cured': d3.sum(d, a => a['新增治愈出院数']) })).entries(dataCountry)

          Dataset.dataCountryByDate = dataCountryByDate
          let dataCountryAccByDate = []
          let objCountry = {}
          objCountry['key'] = 'day -1'
          objCountry['count'] = 0
          objCountry['accCount'] = 0
          dataCountryAccByDate.push(objCountry)
          for (let i = 0; i < dataCountryByDate.length; i++) {
            let obj = {}
            obj['key'] = dataCountryByDate[i]['key']
            let accCount = dataCountryAccByDate[i]['accCount'] + dataCountryByDate[i]['value']['sum']
            let count = dataCountryByDate[i]['value']['sum']
            obj['count'] = count
            obj['accCount'] = accCount
            dataCountryAccByDate.push(obj)
          }
          dataCountryAccByDate.shift()
          Dataset.dataCountryAccByDate = dataCountryAccByDate
          let dictProvinceByDate = dataProvinceByDate.map(a => {
            let tmp = {}
            tmp['key'] = a['key']
            tmp['count'] = a['count']
            tmp['accCount'] = a['accCount']
            let obj = {}
            a['values'].forEach(x => {
              obj[x['key']] = x['value']['sum']
            })
            tmp['values'] = obj
            return tmp
          })
          Dataset.dictProvinceByDate = dictProvinceByDate

          let dictProvinceAccByDate = dataProvinceAccByDate.map(a => {
            let tmp = {}
            tmp['key'] = a['key']
            tmp['count'] = a['count']
            tmp['accCount'] = a['accCount']
            let obj = {}
            a['values'].forEach(x => {
              obj[x['key']] = x['value']['sum']
            })
            tmp['values'] = obj
            return tmp
          })
          Dataset.dictProvinceAccByDate = dictProvinceAccByDate

          Promise.all(promiseList).then(
            function (files) {
              files.forEach((json, i) => {
                json.provId = i
                jsonSet[i] = json;
                renderGeoPath(json)
              })
              return files
            }
          ).then(
            function () {
              CountByCountry_Confirmed_ViewModel =
                d3.sum(Dataset.dataAccByDate[Dataset.dataAccByDate.length - 1].values, a => a.value.sum)
              CountByCountry_Dead_ViewModel =
                d3.sum(Dataset.dataAccByDate[Dataset.dataAccByDate.length - 1].values, a => a.value.dead)
              CountByCountry_Cured_ViewModel =
                d3.sum(Dataset.dataAccByDate[Dataset.dataAccByDate.length - 1].values, a => a.value.cured)


              var tmpDate = startDate;

              while (tmpDate.getTime() < endDate.getTime()) {
                getDataPrepared(DateToConsultString(tmpDate));
                tmpDate = new Date(tmpDate.getTime() + 86400000);
              }
            }
          ).then(
            console.log("Async Work Done.")
          )
        })
      })

}

function fetchGeoPath(file_name, file_dir) {
  return d3.json(file_dir + file_name + '.json')
}

var borderCollections;
function renderGeoPath(json) {
  layer1
    .selectAll('.cities')
    .data(json.features)
    .enter()
    .append('path')
    .attr('id', d => 'cityID-' + d.properties.id)
    .attr('class', 'city')
    .attr('d', pathMap)
    .attr('fill', 'transparent')
    .attr('cursor', 'pointer')
    .attr('stroke', Theme.backgroundColor)
    .attr('stroke-width', Theme.mapBaselineWidth)
    .classed('provID-' + json.provId, true)
    .on('click', (d) => {
      InitializeHighlight([{ key: d.properties.id, cityName: d.properties.name }])
    })

  borderCollections = layer2
    .selectAll('.centerPoints')
    .data(json.features)
    .enter()
    .append('g')
    .attr('transform', d => 'translate(' + (projection(d.properties.cp ? d.properties.cp : [0, 0])[0] - Theme.svgSize / 2) +
      ',' + (projection(d.properties.cp ? d.properties.cp : [0, 0])[1] - Theme.svgSize / 2) + ')')

    .attr("id", d => "centerPoint-" + d.properties.id)
    .attr("class", "centerPoint")

}

function getValueInterface(cityName, selectedDate, selectedKey) {
  var dataInCorrespondingDate = Dataset.dataByDate.filter((d) => {
    return d.key == selectedDate;
  })
  if (dataInCorrespondingDate.length == 0) return 0;
  var dt = dataInCorrespondingDate[0].values.filter((c) => {
    return c.key == cityName;
  })
  if (dt.length == 0) return 0;
  return dt[0].value[selectedKey];
}


function getValueAccInterface(cityName, selectedDate, selectedKey) {
  var dataInCorrespondingDate = Dataset.dataAccByDate.filter((d) => {
    return d.key == selectedDate;
  })
  if (dataInCorrespondingDate.length == 0) return 0;
  var dt = dataInCorrespondingDate[0].values.filter((c) => {
    return c.key == cityName;
  })
  if (dt.length == 0) return 0;
  return dt[0].value[selectedKey];
}

function getOpacity(val, maxVal = 4000) {
  return Math.cbrt(val / maxVal) + 0.1;
}


function updateCityPathColor(cityID, color, alpha) {
  d3.selectAll('#cityID-' + cityID)
    .transition()
    .duration(640)
    .attr('fill', color)
    .attr('opacity', alpha)
}

function getCityArea(cityName) {
  return cityAreaList[cityNameList.indexOf(cityName)]
}
function getCityPopulation(cityName) {
  return cityPopulationList[cityNameList.indexOf(cityName)]
}




fetchData()


var DataRecords = [];

function getDataPrepared(selectedDate) {
  var DataRecordForDate = {
    DateKey: selectedDate,
    records: []
  }
  let dataInCorrespondingDate = Dataset.dataByDate.filter((d) => {
    return d.key == selectedDate;
  })
  if (dataInCorrespondingDate.length == 0) {
    console.log(DataRecords[DataRecords.length - 1], DataRecords)
    DataRecordForDate.records = DataRecords[DataRecords.length - 1].records.map(
      (e) => { e.Confirmed = 0, e.Dead = 0, e.Cured = 0; return e }
    )
    DataRecords.push(DataRecordForDate)
    return;
  }
  jsonSet.forEach(json => {
    json.features.forEach(cityJson => {
      let tmpRet = {
        key: +cityJson.properties.id,
        name: cityJson.properties.name,
        provName: json_provinces_provinceName[json.provId],
        Confirmed: getValueInterface(cityJson.properties.name, selectedDate, "sum"),
        ConfirmedAccumulatedValue: getValueAccInterface(cityJson.properties.name, selectedDate, "sum"),
        Dead: getValueInterface(cityJson.properties.name, selectedDate, "dead"),
        DeadAccumulatedValue: getValueAccInterface(cityJson.properties.name, selectedDate, "dead"),
        Cured: getValueInterface(cityJson.properties.name, selectedDate, "cured"),
        CuredAccumulatedValue: getValueAccInterface(cityJson.properties.name, selectedDate, "cured"),
        Area: getCityArea(cityJson.properties.name),
        Population: getCityPopulation(cityJson.properties.name),
        ConfirmedByArea: 0,
        ConfirmedByPopulation: 0,
        DeadByArea: 0,
        DeadByPopulation: 0,
        DeadByConfirmed: 0,
        CuredByArea: 0,
        CuredByPopulation: 0,
        CuredByConfirmed: 0,
      }
      tmpRet.ConfirmedByArea = tmpRet.ConfirmedAccumulatedValue / tmpRet.Area;
      tmpRet.CuredByArea = tmpRet.CuredAccumulatedValue / tmpRet.Area;
      tmpRet.DeadByArea = tmpRet.DeadAccumulatedValue / tmpRet.Area;
      tmpRet.ConfirmedByPopulation = tmpRet.ConfirmedAccumulatedValue / tmpRet.Population;
      tmpRet.CuredByPopulation = tmpRet.CuredAccumulatedValue / tmpRet.Population;
      tmpRet.DeadByPopulation = tmpRet.DeadAccumulatedValue / tmpRet.Population;
      tmpRet.CuredByConfirmed = tmpRet.ConfirmedAccumulatedValue > 0 ? (tmpRet.CuredAccumulatedValue / tmpRet.ConfirmedAccumulatedValue) : 0;
      tmpRet.DeadByConfirmed = tmpRet.ConfirmedAccumulatedValue > 0 ? (tmpRet.DeadAccumulatedValue / tmpRet.ConfirmedAccumulatedValue) : 0;
      DataRecordForDate.records.push(tmpRet)
    })
  })
  DataRecords.push(DataRecordForDate)
}

var CountByCountry_Confirmed_ViewModel = 0;
var CountByCountry_Cured_ViewModel = 0;
var CountByCountry_Dead_ViewModel = 0;


var _sKey, _sDate, _sMode;
function fetchDataViewModel(sKey, sDate, sMode) {

  let targetDataSet = DataRecords.filter(e => e.DateKey == DateToConsultString(sDate))
  if (targetDataSet.length == 0) return [];
  InitializeLegend(sKey, sMode);
  _sKey = sKey, _sDate = sDate, _sMode = sMode;
  layer2.selectAll("image").attr('xlink:href', _sKey + 'LocationBaconSvgAnimation.svg')
  let retDataSet = [];
  UpdateSelectedCityInfo();
  switch (sMode) {
    case 'AccumulatedValue':
      targetDataSet[0].records.forEach((e) => {
        retDataSet.push({
          key: e.key,
          value: e[sKey + 'AccumulatedValue'],
          cityName: e.name,
          provName: e.provName,
          referValue: e.ConfirmedAccumulatedValue > 0
        })
      })
      setTimeout(() => {
        retDataSet.forEach(rd => {
          layer1.selectAll("#cityID-" + rd.key)
            .transition()
            .duration(500)
            .attr("fill", rd.value > 0 ? Theme[sKey + "Color"] :
              rd.referValue ? Theme.sumAccentColor :
                Theme.NoneValueColor)
            .attr("opacity", Math.cbrt(rd.value / maxOpacityValue[sKey][sMode])
              + Theme.noneValueOpacity)
        })
      }, 80);
      break;
    case 'OriginalValue':
      targetDataSet[0].records.forEach((e) => {
        retDataSet.push({
          key: e.key,
          value: e[sKey],
          cityName: e.name,
          provName: e.provName,
          referValue: e.Confirmed > 0
        })
      })
      setTimeout(() => {
        retDataSet.forEach(rd => {
          layer1.selectAll("#cityID-" + rd.key)
            .transition()
            .duration(500)
            .attr("fill", rd.value > 0 ? Theme[sKey + "Color"] :
              rd.referValue ? Theme.sumAccentColor :
                Theme.NoneValueColor)
            .attr("opacity", Math.cbrt(rd.value / maxOpacityValue[sKey][sMode])
              + Theme.noneValueOpacity)
        })
      }, 80);
      break;
    case 'ByArea':
      targetDataSet[0].records.forEach((e) => {
        retDataSet.push({
          key: e.key,
          value: e[sKey + sMode],
          cityName: e.name,
          provName: e.provName,
          referValue: e.ConfirmedAccumulatedValue > 0
        })
      })
      setTimeout(() => {
        retDataSet.forEach(rd => {
          layer1.selectAll("#cityID-" + rd.key)
            .transition()
            .duration(500)
            .attr("fill",
              rd.referValue == 0 ? Theme.NoneValueColor :
                rd.value > 0 ? Theme[sKey + "Color"] :
                  Theme.sumAccentColor)
            .attr("opacity", Math.cbrt(rd.value / maxOpacityValue[sKey][sMode])
              + Theme.noneValueOpacity)
        })
      }, 80);
      break;
    case 'ByPopulation':
      targetDataSet[0].records.forEach((e) => {
        retDataSet.push({
          key: e.key,
          value: (e[sKey + sMode]),
          cityName: e.name,
          provName: e.provName,
          referValue: e.ConfirmedAccumulatedValue > 0
        })
      })
      setTimeout(() => {
        retDataSet.forEach(rd => {
          layer1.selectAll("#cityID-" + rd.key)
            .transition()
            .duration(500)
            .attr("fill",
              rd.referValue == 0 ? Theme.NoneValueColor :
                rd.value > 0 ? Theme[sKey + "Color"] :
                  Theme.sumAccentColor)
            .attr("opacity", Math.cbrt(rd.value / maxOpacityValue[sKey][sMode])
              + Theme.noneValueOpacity)
        })
      }, 80);
      break;
    case 'ByConfirmed':
      targetDataSet[0].records.forEach((e) => {
        var tmpVal = e[sKey + 'AccumulatedValue']
        retDataSet.push({
          key: e.key,
          value: e[sKey + sMode],
          cityName: e.name,
          provName: e.provName,
          referValue: e.ConfirmedAccumulatedValue > 0
        })
      })
      setTimeout(() => {
        retDataSet.forEach(rd => {
          layer1.selectAll("#cityID-" + rd.key)
            .transition()
            .duration(500)
            .attr("fill",
              rd.referValue == 0 ? Theme.NoneValueColor :
                rd.value > 0 ? Theme[sKey + "Color"] :
                  Theme.sumAccentColor)
            .attr("opacity", rd.value >= 0 ? Math.cbrt(rd.value / maxOpacityValue[sKey][sMode])
              + Theme.noneValueOpacity : Theme.noneValueOpacity)
        })

      }, 80);
      break;
  }
  return retDataSet.sort((a, b) => {
    return b.value - a.value;
  });

}



var _selectionList;
function InitializeHighlight(e) {
  _selectionList = e;
  layer2.selectAll("image").remove();
  UpdateSelectedCityInfo(e)
  var ExemptedKey = [];
  e.forEach(ee => ExemptedKey.push(ee.key))
  ExemptedKey.forEach((t) => {
    d3.select("#centerPoint-" + t)
      .append('image').attr('xlink:href', _sKey + 'LocationBaconSvgAnimation.svg')
      .attr('height', Theme.svgSize)
      .attr('width', Theme.svgSize)
  })
  return ExemptedKey;
}


const layer1_Prov = d3.select("#layer1_Prov")
d3.json("china-geojson-master/china.json").then(
  j => layer1_Prov.selectAll('.borders')
    .data(j.features)
    .enter()
    .append('path')
    .attr('d', pathMap)
    .attr('fill', 'transparent')
    .attr('stroke', 'white')
    .attr('stroke-width', Theme.mapProvlineWidth)
)


const LegendConfig = {
  rectWidth: 38,
  rectHeight: 14,
  rectPadding: 8,
  textRectPadding: 12,
  radius: 1.5
}
function InitializeLegend(sKey, sMode) {
  d3.select("#LegendLayer").remove();
  let lc = d3.select("#LegendCanvas").append("g").attr("id", "LegendLayer");
  lc.append("rect").attr("width", LegendConfig.rectWidth)
    .attr("rx", LegendConfig.radius)
    .attr("ry", LegendConfig.radius)
    .attr("height", LegendConfig.rectHeight)
    .attr("fill", Theme.NoneValueColor)
    .attr("opacity", Theme.noneValueOpacity)
  lc.append("text").text(sMode != "OriginalValue" ? "无累计确诊" : "无新增确诊")
    .attr('y', 0.5 * LegendConfig.rectHeight + 1.3)
    .attr('x', LegendConfig.rectWidth + LegendConfig.rectPadding)
    .attr('font-size', "14px")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", 'middle')


  const LegendLevel = maxOpacityValue[sKey][sMode + "_Legend"];

  const OpacityOperator = e => Math.cbrt(e / maxOpacityValue[sKey][sMode])
    + Theme.noneValueOpacity;

  var xOffset = 0;

  LegendLevel.forEach((e) => {
    lc.append("rect").attr("width", LegendConfig.rectWidth)
      .attr("rx", LegendConfig.radius)
      .attr("ry", LegendConfig.radius)
      .attr("x", xOffset)
      .attr("y", LegendConfig.textRectPadding + LegendConfig.rectHeight)
      .attr("height", LegendConfig.rectHeight)
      .attr("fill", Theme[sKey + "Color"])
      .attr("opacity", OpacityOperator(e))

    lc.append("text").text(e)
      .attr('y', LegendConfig.textRectPadding + 1.5 * LegendConfig.rectHeight + 1.3)
      .attr('x', xOffset + 1)
      .attr('font-size', "10px")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", 'middle')
      .attr('fill', OpacityOperator(e) > 0.5 ? 'white' : 'black')
    xOffset += LegendConfig.rectWidth + LegendConfig.rectPadding;
  }
  )
  lc.append("rect").attr("width", LegendConfig.rectWidth)
    .attr("rx", LegendConfig.radius)
    .attr("ry", LegendConfig.radius)
    .attr("height", LegendConfig.rectHeight)
    .attr("fill", Theme.NoneValueColor)
    .attr("opacity", Theme.noneValueOpacity)

  if (sKey != "Confirmed") {
    lc.append("rect").attr("width", LegendConfig.rectWidth)
      .attr("rx", LegendConfig.radius)
      .attr("ry", LegendConfig.radius)
      .attr("height", LegendConfig.rectHeight)
      .attr("fill", Theme.ConfirmedColor)
      .attr("opacity", Theme.noneValueOpacity)
      .attr("x", (LegendConfig.rectWidth + LegendConfig.rectPadding) * 3)

    lc.append("text").text(
      sMode != "OriginalValue" ?
        (sKey == "Cured" ? "有累计确诊但无累计治愈" : "有累计确诊但无累计死亡") :
        (sKey == "Cured" ? "有新增确诊但无新增治愈" : "有新增确诊但无新增死亡")
    )
      .attr('y', 0.5 * LegendConfig.rectHeight + 1.3)
      .attr('x', (LegendConfig.rectWidth + LegendConfig.rectPadding) * 4)
      .attr('font-size', "14px")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", 'middle')
  }
}

const InfoCanvas = d3.select("#InfoCanvas")

InfoCanvas.append("rect").attr('width', "100%").attr('height', 1)
  .attr('y', 104).attr("fill", "#00000030")
InfoCanvas.append("text").attr('y', 104).attr("fill", "#00000030")
  .text("1 月 10 日")
  .attr("text-anchor", "start")
  .attr("dominant-baseline", "text-before-edge")
  .attr('font-size', 10)
InfoCanvas.append("text").attr('y', 104).attr("fill", "#00000030")
  .text("2020 年")
  .attr("text-anchor", "start")
  .attr("dominant-baseline", "text-after-edge")
  .attr('font-size', 10)
InfoCanvas.append("text").attr('y', 104).attr('x', '100%').attr("fill", "#00000030")
  .text((new Date().getMonth() + 1) + " 月 " + (new Date().getDate() - 1) + " 日 ")
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "text-before-edge")
  .attr('font-size', 10)
InfoCanvas.append("text").attr('y', 104).attr('x', '100%').attr("fill", "#00000030")
  .text("2020 年")
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "text-after-edge")
  .attr('font-size', 10)


function UpdateSelectedCityInfo(selectionList = _selectionList) {

  let labelInnerText = "";
  if (selectionList.length > 0) {
    labelInnerText += " (" + selectionList[0].cityName;
    if (selectionList.length > 5) {
      for (var i = 1; i < 5; i++)
        labelInnerText += "、" + selectionList[i].cityName;
      labelInnerText += "等 " + selectionList.length + " 座城市";

    }
    else {
      for (var i = 1; i < selectionList.length; i++)
        labelInnerText += "、" + selectionList[i].cityName;
    }
    labelInnerText += ")"
  }

  d3.select("#InfoLabel")
    .text(labelInnerText)


  InfoCanvas.selectAll("g").transition().duration(120).attr("opacity", 0);
  setTimeout(() => {
    UpdateSelectedCityInfo_Core(selectionList);
  }, 200);
}

function UpdateSelectedCityInfo_Core(selectionList = _selectionList) {
  InfoCanvas.selectAll("g").remove();




  if (selectionList.length > 0) {


    let TimelineLayer = InfoCanvas.append("g").attr('opacity', 0);





    function collectKeySepecifiedData(_key) {
      let lineChartData = [];
      selectionList.forEach((selectedCity) => {
        let t = [];
        let tmpDate = startDate;
        while (tmpDate.getTime() < endDate.getTime()) {
          t.push(DataRecords.filter(e => e.DateKey == DateToConsultString(tmpDate))[0].records
            .filter(e => e.key == selectedCity.key)[0][_key])
          tmpDate = new Date(tmpDate.getTime() + 86400000);
        }
        lineChartData.push(t);
      })
      return lineChartData;
    }



    let DataSorted = []
    let charMax = 1;

    if (_sMode == "AccumulatedValue") {
      let dataCollected = collectKeySepecifiedData(_sKey + _sMode)
      DataSorted = dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]));
      let _mx = d3.max(DataSorted);

      charMax = _mx < 50 ?
        50 : _mx < 100 ?
          100 : _mx < 250 ?
            250 : _mx < 500 ?
              500 : _mx < 1000 ?
                1000 : _mx < 2500 ?
                  2500 : _mx < 5000 ?
                    5000 : _mx < 10000 ?
                      10000 : _mx < 20000 ?
                        20000 : 50000

    }
    else if (_sMode == "OriginalValue") {
      let dataCollected = collectKeySepecifiedData(_sKey + _sMode)
      DataSorted = dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]))
      charMax = 2000;

    }
    else if (_sMode == "ByConfirmed") {
      let dataCollected = collectKeySepecifiedData(_sKey + "AccumulatedValue")
      let _dataCollected = collectKeySepecifiedData("ConfirmedAccumulatedValue")

      let _DataSorted = _dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]))
      DataSorted = dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]))
      DataSorted = DataSorted.map((itm, idx) => itm / _DataSorted[idx])
      charMax = 1;
    }
    else if (_sMode == "ByArea") {
      let dataCollected = collectKeySepecifiedData(_sKey + "AccumulatedValue")
      DataSorted = dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]))
      let Area_sum = 0;
      selectionList.forEach((selectedCity) => {
        Area_sum += DataRecords[0].records.filter(e => e.key == selectedCity.key)[0].Area;
      })
      DataSorted = DataSorted.map(e => e / Area_sum);
      charMax = _sKey == "Confirmed" ? 2 : 0.15;
    }

    else if (_sMode == "ByPopulation") {
      let dataCollected = collectKeySepecifiedData(_sKey + "AccumulatedValue")
      DataSorted = dataCollected.reduce((e, t) => e.map((itm, idx) => itm + t[idx]))
      let Area_pop = 0;
      selectionList.forEach((selectedCity) => {
        Area_pop += DataRecords[0].records.filter(e => e.key == selectedCity.key)[0].Population;
      })
      DataSorted = DataSorted.map(e => e / Area_pop);

      charMax = _sKey == "Confirmed" ? 15 : .8;
    }

    console.log(DataSorted, charMax)

    for (var _lineIndex = 1; _lineIndex <= 4; _lineIndex++) {
      TimelineLayer.append('rect').attr('width', '100%').attr('height', 1)
        .attr('fill', '#00000030')
        .attr('y', 105 - _lineIndex * 20)
      TimelineLayer.append('text').text(Math.round((charMax * _lineIndex) * 20) / 100)
        .attr('fill', '#00000080')
        .attr('y', 106.3 - _lineIndex * 20)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 10)
    }

    //let boundingWidth = document.getElementById("InfoCanvas").getBoundingClientRect().width;

    TimelineLayer.selectAll("defs").remove();
    let TimelineLayer_GrdtDefs = TimelineLayer.append("defs");
    TimelineLayer.selectAll(".TimelineBar")
      .data(DataSorted)
      .enter()
      .append('rect')
      .attr('x', (d, i) => ((i + 0.5) * 100 / (DataSorted.length + 1)) + "%")
      .attr('width', (100 / (DataSorted.length + 8)) + "%")
      .attr('height', d => (d / charMax) * 100)
      .attr('rx', 1.5)
      .attr('ry', 1.5)
      .attr('y', d => (104 - (d / charMax) * 100))
      .attr("opacity", d => d != 0)
      .attr("stroke", Theme[_sKey + "BorderColor"])
      .attr("stroke-width", Theme.mapBaselineWidth)
      .attr('id', (d, i) => 'tb' + i)
      .attr("fill", (d, i) => {
        let grdt = TimelineLayer_GrdtDefs.append("linearGradient")
          .attr("id", "Tbg" + i)
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2", "0%")
        grdt.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", Theme[_sKey + "Color"])
          .attr("stop-opacity", 0.02)
        grdt.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", Theme[_sKey + "Color"])
          .attr("stop-opacity", 0.03 + 0.5 * d / maxOpacityValue[_sKey][_sMode])

        return "url(#Tbg" + i + ")"
      })
    TimelineLayer.selectAll(".TimelineBar")
      .data(DataSorted)
      .enter()
      .append('rect')
      .attr('width', (100 / (DataSorted.length + 8)) + "%")
      .attr('height', 100)
      .attr('y', 4)
      .attr('opacity', 0)
      .attr('x', (d, i) => ((i + 0.5) * 100 / (DataSorted.length + 1)) + "%")
      .on('mouseover', (d, i) => {


        let selectedBar = d3.select("#tb" + i);
        let dateText = new Date(startDate.getTime() + 86400000 * i)
        console.log(dateText)
        TimelineLayer.append('text')
          .text(_sMode == "ByConfirmed" ? (Math.round(d * 10000) / 100 + "%") : Math.round(d * 10000) / 10000)
          .attr('x', ((i + 0.4) * 100 / (DataSorted.length + 1)) + "%")
          .attr('y', 80)
          .attr('text-anchor', i > 5 ? 'end' : 'start')
          .attr('class', 'TimelineHint')
          .attr('font-size', 36)
          .attr('fill', Theme[_sKey + 'BorderColor'])
          .attr('font-weight', 700)
          .attr('pointer-events', 'none')
        TimelineLayer.append('text')
          .text(dateText.getFullYear() + " 年 " + (dateText.getMonth() + 1) + " 月 " + dateText.getDate() + " 日 ")
          .attr('x', ((i + 0.5) * 100 / (DataSorted.length + 1)) + "%")
          .attr('y', 44)
          .attr('text-anchor', i > 5 ? 'end' : 'start')
          .attr('class', 'TimelineHint')
          .attr('font-size', 14)
          .attr('fill', '#000000')
          .attr('pointer-events', 'none')
          .attr('transform', 'translate(' + (i > 5 ? -4 : 4) + ',' + 0 + ')')
        setTimeout(() => {
          selectedBar.transition().duration(80).attr('stroke-width', 2 * Theme.mapProvlineWidth)
        }, 120)
      })
      .on('mouseout', (d, i) => {
        TimelineLayer.selectAll(".TimelineHint").remove();
        //d3.select("#TimelineTextAccent").text('');
        setTimeout(() => {
          d3.select("#tb" + i).transition().duration(120).attr('stroke-width', Theme.mapBaselineWidth);
        }, 120)
      })

    /*
    var pathGenerator = d3.line()
      .x(function (d, i) { return (i + 0.5) * (boundingWidth / DataSorted.length); }) // set the x values for the line generator
      .y(function (d) { return 105 - d / charMax; }) // set the y values for the line generator 
      .curve(d3.curveCardinal)

    TimelineLayer
      .selectAll(".LineChartNode")
      .data(DataSorted)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => (100 / DataSorted.length * (i + 0.5)) + '%')
      .attr("cy", d => (105 - (d / charMax)))
      .attr('r', 5)
      .attr('fill', Theme[_sKey + "Color"])
      .attr('stroke', Theme.backgroundColor)
      .attr('stroke-width', Theme.mapProvlineWidth)

    TimelineLayer.append('path')
      .attr('d', pathGenerator(DataSorted))
      .attr('fill', 'none')
      .attr('stroke', Theme[_sKey + "Color"])
      .attr('stroke-width', Theme.mapProvlineWidth)


    if (selectionList.length <= 5) {
      lineChartData.forEach((lineData) => {

        TimelineLayer
          .selectAll(".LineChartNode")
          .data(lineData)
          .enter()
          .append('circle')
          .attr('cx', (d, i) => (100 / lineData.length * (i + 0.5)) + '%')
          .attr("cy", d => (105 - (d / charMax)))
          .attr('r', 3)
          .attr('fill', Theme[_sKey + "Color"])
          .attr('stroke', Theme.backgroundColor)
          .attr('stroke-width', Theme.mapProvlineWidth)

      })
    }
    */
    TimelineLayer.transition().duration(200).attr('opacity', 1);
  }

}