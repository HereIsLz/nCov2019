const __DEBUG = false;
const defaultDate = "2月4日"

const Theme = {
  backgroundColor: 'white',
  baseAccentColor: 'white',
  secureAccentColor: '#1565c0',

  sumAccentColor: '#e64a19',
  deadAccentColor: '#4a148c',
  curedAccentColor: '#43a047',

  sumMaxValue: 5000,
  deadMaxValue: 400,
  curedMaxValue: 400,

  mapBaselineWidth: 0.5,
  noneValueOpacity: 0.16
}



var Dataset = Object;
const json_provinces_arr = ['11', '12', '13', '14', '15', '21', '22', '23', '31', '32', '33', '34', '35', '36', '37', '41', '42', '43', '44', '45', '46', '50', '51', '52', '53', '54', '61', '62', '63', '64', '65', '71', '81', '82']
const json_provinces_provinceName = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'];
var jsonSet = []

const promiseList = json_provinces_arr.map(d => fetchGeoPath(d, 'china-geojson-master/geometryProvince/'));


const projection = d3.geoMercator()
  .center([105, 38])
  .scale(720)
  .translate([1000, 380])
const pathMap = d3.geoPath().projection(projection);
const layer1 = d3.select('#layer1')

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
            updateMapColor()
          )
        })
      })

}

function fetchGeoPath(file_name, file_dir) {
  return d3.json(file_dir + file_name + '.json')
}

function renderGeoPath(json) {
  layer1
    .selectAll('.cities')
    .data(json.features)
    .enter()
    .append('path')
    .attr('id', d => 'cityID-' + d.properties.id)
    .attr('class', 'city')
    .attr('d', pathMap)
    .attr('fill', (d) => {
      return getValueInterface(d.properties.name,
        defaultDate, "sum") == 0 ?
        Theme.secureAccentColor :
        Theme.sumAccentColor
    })
    .attr('opacity', (d) => {
      let v = getValueInterface(d.properties.name,
        defaultDate, "sum");
      return v == 0 ?
        Theme.noneValueOpacity :
        getOpacity(v)
    })
    .attr('stroke', Theme.backgroundColor)
    .attr('stroke-width', Theme.mapBaselineWidth)
    .classed('provID-' + json.provId, true)
}




function getValueInterface(cityName, selectedDate, selectedKey) {
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
    .duration(320)
    .attr('fill', color)
    .attr('opacity', alpha)
}



function updateMapColor(selectedKey = "sum", selectedDate = defaultDate, statisticMode = "OriginalValue") {

  jsonSet.forEach(json => {
    json.features.forEach(cityJson => {

      let val = getValueInterface(cityJson.properties.name,
        selectedDate, selectedKey)
      let sumVal = getValueInterface(cityJson.properties.name,
        selectedDate, "sum")
      updateCityPathColor(
        cityJson.properties.id,

        sumVal == 0 ? Theme.secureAccentColor :
          val == 0 ? Theme.sumAccentColor :
            Theme[selectedKey + 'AccentColor'],

        val == 0 ? Theme.noneValueOpacity :
          getOpacity(val, Theme[selectedKey + 'MaxValue'])
      )
    })
  })
}

fetchData()

function recolorMap(k) {
  switch (k) {
    case 'Confirmed':
      updateMapColor('sum');
      return;
    case 'Dead':
      updateMapColor('dead');
      return;
    case 'Cured':
      updateMapColor('cured');
      return;
  }
}