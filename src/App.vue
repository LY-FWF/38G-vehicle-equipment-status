<script>
import { onMounted, reactive, onUnmounted, ref, inject, computed } from 'vue';//组件导入,复制进去
import getDate from '../src/js/time'//导入时间函数
import Speed11 from './components/air11.vue'
import Speed12 from './components/air12.vue'
import Speed13 from './components/air13.vue'
import Speed14 from './components/air14.vue'

export default {
  name: 'HomeView',
  components: {
    Speed11,
    Speed12,
    Speed13,
    Speed14,
  },

  setup() {
    const worker = inject("worker");

    const x_Temp1 = reactive([[0, 0, 0, 0]]);
    const x_Airquality = reactive([[0, 0, 0, 0]]);
    const x_Base = reactive
      ({
        msg: 0,//基础数据接驳
        symple: 0,//报文标志位
        comid: 0,//comID用于区分单节车两个空调
      })
    const x_Airconditioner1 = reactive({})

    const x_Airconditioner2 = reactive({})

    const replaceObject = (newObject, oldObject) => {
      for (let key in oldObject) {
        newObject[key] = oldObject[key]
      }
      // console.log(newObject)
    }
    const formatDate = () => {
      var date = new Date()// 时间戳为10位需*1000，时间戳为13位的话不需乘1000
      var hour = ('0' + date.getHours()).slice(-2)
      var minute = ('0' + date.getMinutes()).slice(-2)
      var second = ('0' + date.getSeconds()).slice(-2)
      var milsec = date.getMilliseconds()
      // 拼接
      var result = hour + ':' + minute + ':' + second + ':' + milsec
      // 返回
      return result
    }

    const colorSig = (sig) => {
      if (sig) {
        return "#00ffff";
      } else {
        return '#00657F';
      }
      ;
    }//定义方法

    const colorSig2 = (sig) => {
      if (sig == 0) {
        return "#ee1402";
      } else {
        return '#00657F';
      }
      ;
    }
    //获取当前时间
    const x_TimeData = reactive({
      nowTime: "",
      nowWeek: "",
    })
    const currentTime = () => {
      setInterval(() => {
        x_TimeData.nowTime = getDate().nowTime;
        x_TimeData.nowWeek = getDate().nowWeek;
        //console.log(x_TimeData)
      }, 1000)
    };
    // ====== 可配置项默认值（运行时可通过 config.json 覆盖）======
    const DEFAULT_TITLE = '高速磁浮38G车载设备状态'
    const DEFAULT_LOGOS = [
      { src: 'logo.png', width: 124.65, height: 41.43 }
    ]

    const title = ref(DEFAULT_TITLE)
    const logos = ref(DEFAULT_LOGOS)
    const logoGap = ref(24)
    const titleAlign = ref('center') // 主标题对齐方式：'center' 居中 | 'left' 原位置

    // logo 区域基准参数（与原设计保持一致）
    const LOGO_START_X = 39.2
    const LOGO_BASE_Y = 10.45
    const LOGO_MAX_HEIGHT = 41.43
    const LOGO_DEFAULT_WIDTH = 124.65

    // 多 logo 一行布局：从左至右依次排列，垂直方向居中对齐
    const logoItems = computed(() => {
      let cursorX = LOGO_START_X
      const list = logos.value
      return list.map((logo, index) => {
        const height = Number(logo.height) > 0 ? Number(logo.height) : LOGO_MAX_HEIGHT
        const width = Number(logo.width) > 0 ? Number(logo.width) : LOGO_DEFAULT_WIDTH
        const y = LOGO_BASE_Y + (LOGO_MAX_HEIGHT - height) / 2
        const item = { x: cursorX, y, width, height, src: logo.src }
        cursorX += width + (index < list.length - 1 ? logoGap.value : 0)
        return item
      })
    })

    // 主标题布局：居中时以画布中线对齐，左对齐时保持原位置
    const TITLE_LEFT_X = 708.5
    const titleProps = computed(() => {
      if (titleAlign.value === 'center') {
        return { x: 960, anchor: 'middle' } // 1920 / 2
      }
      return { x: TITLE_LEFT_X, anchor: 'start' }
    })

    // 运行时加载外部配置文件（打包后位于 dist/config.json，可直接修改无需重新构建）
    onMounted(async () => {
      try {
        const res = await fetch('./config.json', { cache: 'no-cache' })
        if (!res.ok) return
        // 防止 SPA fallback 返回 index.html（非 JSON）导致解析报错
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) return
        const config = await res.json()
        if (typeof config.title === 'string' && config.title.trim()) {
          title.value = config.title
        }
        if (Array.isArray(config.logos)) {
          const valid = config.logos.filter(l => l && typeof l.src === 'string' && l.src.trim())
          if (valid.length) logos.value = valid
        }
        if (typeof config.logoGap === 'number' && config.logoGap >= 0) {
          logoGap.value = config.logoGap
        }
        if (typeof config.titleAlign === 'string' && ['center', 'left'].includes(config.titleAlign)) {
          titleAlign.value = config.titleAlign
        }
      } catch (e) {
        console.warn('[配置] 加载 config.json 失败，使用默认配置', e)
      }

      currentTime()
      worker.onmessage = (event) => {
        const message = event.data;
        // 在这里处理接收到的消息
        const data_state = JSON.parse(message)//转换为双层对象
        const symple = data_state.symple    // 定义标志位并赋值
        const comid = data_state.comid     // 定义COMID并赋值
        switch (symple) {
          case "07":
            if (comid == 1030) {
              var airconditioner1_th1 = data_state.airconditioner1
              replaceObject(x_Airconditioner1, airconditioner1_th1)
              // console.log(x_Airconditioner1)
            }
            if (comid == 1031) {
              var airconditioner2_th1 = data_state.airconditioner2
              replaceObject(x_Airconditioner2, airconditioner2_th1)
            }

            if (x_Temp1.length > 100) {
              x_Temp1.shift();
              x_Temp1.push([formatDate(), x_Airconditioner1.guestroomtemp, x_Airconditioner1.targettemp, x_Airconditioner1.newtrendtemp])
            } else {
              x_Temp1.splice(0, 1)
              x_Temp1.push([formatDate(), x_Airconditioner1.guestroomtemp, x_Airconditioner1.targettemp, x_Airconditioner1.newtrendtemp])
            }
            if (x_Airquality.length > 100) {
              x_Temp1.shift();
              x_Airquality.push([formatDate(), x_Airconditioner1.co2, x_Airconditioner1.pm25, x_Airconditioner1.hcho])
              // console.log(x_Airquality)
            } else {
              x_Airquality.splice(0, 1)
              x_Airquality.push([formatDate(), x_Airconditioner1.co2, x_Airconditioner1.pm25, x_Airconditioner1.hcho])
              // console.log(x_Airquality)
            }
            break;
        }
      };
    })

    onUnmounted(() => {
      if (getDate) {
        clearInterval(getDate) // 在Vue实例销毁前，清除时间定时器
      }
    })
    return {
      x_Airconditioner1,
      x_Airconditioner2,
      x_TimeData,
      x_Airquality,
      x_Base,
      colorSig,
      colorSig2,
      x_Temp1,
      title,
      logoItems,
      titleProps
    }
  }
}
</script>

<template>
  <svg class="block" height="100%" preserveAspectRatio="none" viewBox="0 0 1920 1080" version="1.1" width="100%"
    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- <title>高速磁浮38G车载设备状态</title> -->
    <defs>
      <linearGradient x1="28.1148014%" y1="99.9994492%" x2="28.1148624%" y2="-15.9417764%" id="linearGradient-1">
        <stop stop-color="#0D98FF" offset="0%"></stop>
        <stop stop-color="#0D98FF" stop-opacity="0" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="28.1148014%" y1="99.9994492%" x2="28.1148624%" y2="-15.9417764%" id="linearGradient-2">
        <stop stop-color="#0D98FF" offset="0%"></stop>
        <stop stop-color="#0D98FF" stop-opacity="0" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="28.1148014%" y1="99.9994492%" x2="28.1148624%" y2="-15.9417764%" id="linearGradient-3">
        <stop stop-color="#00A1FF" offset="0%"></stop>
        <stop stop-color="#0D98FF" stop-opacity="0" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="28.1148014%" y1="99.9994492%" x2="28.1148624%" y2="-15.9417764%" id="linearGradient-4">
        <stop stop-color="#0D98FF" offset="0%"></stop>
        <stop stop-color="#0D98FF" stop-opacity="0" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="linearGradient-5">
        <stop stop-color="#0E74B7" stop-opacity="0.583749624" offset="0%"></stop>
        <stop stop-color="#1896E8" stop-opacity="0.147807515" offset="100%"></stop>
      </linearGradient>
      <linearGradient x1="50%" y1="36.2928152%" x2="50%" y2="100%" id="linearGradient-6">
        <stop stop-color="#09446F" offset="0%"></stop>
        <stop stop-color="#016CAB" offset="100%"></stop>
      </linearGradient>
    </defs>
    <g id="高速磁浮38G车载设备状态" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <rect fill="#000000" x="0" y="0" width="1920" height="1080"></rect>
      <g id="编组-6备份-3" transform="translate(355.000000, 102.000000)" fill="#00A1FF" fill-opacity="0.07" stroke="#015A90"
        stroke-width="2">
        <rect id="矩形" x="1" y="1" width="1538" height="547"></rect>
      </g>
      <g id="编组-7备份-3" transform="translate(369.000000, 198.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="221" height="434"></rect>
        <g id="编组-13" transform="translate(0.000000, 79.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.81A,1.53V">
            <tspan x="115.558224" y="26.5131579">0.81A,1.53V</tspan>
          </text>
          <text id="主控板">
            <tspan x="13.8678238" y="26.5131579">主控板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(13.000000, 165.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.58A,2.6V">
            <tspan x="102.869267" y="19">0.58A</tspan>
            <tspan x="151.847267" y="19" font-family="PingFangSC-Semibold, PingFang SC" font-weight="500">,2.6V</tspan>
          </text>
          <text id="变频模块">
            <tspan x="0" y="19">变频模块</tspan>
          </text>
        </g>
        <g id="编组-13备份-5" transform="translate(0.000000, 316.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42度" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.710013" y="26.5131579">42度</tspan>
          </text>
          <text id="接受电平A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接受电平A</tspan>
          </text>
        </g>
        <g id="编组-13备份-8" transform="translate(0.000000, 355.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42%" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.980013" y="26.5131579">42%</tspan>
          </text>
          <text id="接收电平B" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接收电平B</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 237.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">调制电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-6" transform="translate(0.000000, 395.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.44A,E1" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="126.7683" y="26.5131579">0.44A,E1</tspan>
          </text>
          <text id="波道" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">波道</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 276.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="5.6V" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.692159" y="26.5131579">5.6V</tspan>
          </text>
          <text id="发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">发射电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 198.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="解调模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">解调模块</tspan>
          </text>
        </g>
        <text id="通道一" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#FFFFFF">
          <tspan x="92" y="26">通道一</tspan>
        </text>
        <g id="编组-2" transform="translate(0.000000, 119.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="功放模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">功放模块</tspan>
          </text>
          <text id="1.21A,锁定" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="121.368869" y="26.5131579">1.21A,锁定</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="40" width="221" height="39"></rect>
        <text id="基站信息" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="16" y="66">基站信息</tspan>
        </text>
        <text id="0.07A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="137.988" y="66">0.07A</tspan>
        </text>
      </g>
      <g id="编组-7备份-16" transform="translate(829.000000, 198.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="221" height="434"></rect>
        <g id="编组-13" transform="translate(0.000000, 79.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.81A,1.53V">
            <tspan x="115.558224" y="26.5131579">0.81A,1.53V</tspan>
          </text>
          <text id="主控板">
            <tspan x="13.8678238" y="26.5131579">主控板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(13.000000, 165.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.58A,2.6V">
            <tspan x="102.869267" y="19">0.58A</tspan>
            <tspan x="151.847267" y="19" font-family="PingFangSC-Semibold, PingFang SC" font-weight="500">,2.6V</tspan>
          </text>
          <text id="变频模块">
            <tspan x="0" y="19">变频模块</tspan>
          </text>
        </g>
        <g id="编组-13备份-5" transform="translate(0.000000, 316.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42度" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.710013" y="26.5131579">42度</tspan>
          </text>
          <text id="接受电平A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接受电平A</tspan>
          </text>
        </g>
        <g id="编组-13备份-8" transform="translate(0.000000, 355.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42%" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.980013" y="26.5131579">42%</tspan>
          </text>
          <text id="接收电平B" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接收电平B</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 237.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">调制电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-6" transform="translate(0.000000, 395.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.44A,E1" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="126.7683" y="26.5131579">0.44A,E1</tspan>
          </text>
          <text id="波道" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">波道</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 276.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="5.6V" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.692159" y="26.5131579">5.6V</tspan>
          </text>
          <text id="发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">发射电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 198.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="解调模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">解调模块</tspan>
          </text>
        </g>
        <text id="通道一" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#FFFFFF">
          <tspan x="92" y="26">通道一</tspan>
        </text>
        <g id="编组-2" transform="translate(0.000000, 119.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="功放模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">功放模块</tspan>
          </text>
          <text id="1.21A,锁定" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="121.368869" y="26.5131579">1.21A,锁定</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="40" width="221" height="39"></rect>
        <text id="基站信息" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="16" y="66">基站信息</tspan>
        </text>
        <text id="0.07A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="137.988" y="66">0.07A</tspan>
        </text>
      </g>
      <g id="编组-7备份-15" transform="translate(593.000000, 198.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="221" height="434"></rect>
        <g id="编组-13" transform="translate(0.000000, 79.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.81A,1.53V">
            <tspan x="115.558224" y="26.5131579">0.81A,1.53V</tspan>
          </text>
          <text id="主控板">
            <tspan x="13.8678238" y="26.5131579">主控板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(14.000000, 165.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.58A,2.6V">
            <tspan x="102.869267" y="19">0.58A</tspan>
            <tspan x="151.847267" y="19" font-family="PingFangSC-Semibold, PingFang SC" font-weight="500">,2.6V</tspan>
          </text>
          <text id="变频模块">
            <tspan x="0" y="19">变频模块</tspan>
          </text>
        </g>
        <g id="编组-13备份-5" transform="translate(0.000000, 316.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42度" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.710013" y="26.5131579">42度</tspan>
          </text>
          <text id="接受电平A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接受电平A</tspan>
          </text>
        </g>
        <g id="编组-13备份-8" transform="translate(0.000000, 355.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42%" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.980013" y="26.5131579">42%</tspan>
          </text>
          <text id="接收电平B" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接收电平B</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 237.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">调制电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-6" transform="translate(0.000000, 395.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.44A,E1" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="126.7683" y="26.5131579">0.44A,E1</tspan>
          </text>
          <text id="波道" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">波道</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 276.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="5.6V" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.692159" y="26.5131579">5.6V</tspan>
          </text>
          <text id="发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">发射电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 198.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="解调模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">解调模块</tspan>
          </text>
        </g>
        <text id="通道二" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#FFFFFF">
          <tspan x="92" y="26">通道二</tspan>
        </text>
        <g id="编组-2" transform="translate(0.000000, 119.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="功放模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">功放模块</tspan>
          </text>
          <text id="1.21A,锁定" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="121.368869" y="26.5131579">1.21A,锁定</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="40" width="221" height="39"></rect>
        <text id="基站信息" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="17" y="66">基站信息</tspan>
        </text>
        <text id="0.07A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="137.988" y="66">0.07A</tspan>
        </text>
      </g>
      <g id="编组-7备份-17" transform="translate(1053.000000, 198.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="221" height="434"></rect>
        <g id="编组-13" transform="translate(0.000000, 79.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.81A,1.53V">
            <tspan x="115.558224" y="26.5131579">0.81A,1.53V</tspan>
          </text>
          <text id="主控板">
            <tspan x="13.8678238" y="26.5131579">主控板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(14.000000, 165.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.58A,2.6V">
            <tspan x="102.869267" y="19">0.58A</tspan>
            <tspan x="151.847267" y="19" font-family="PingFangSC-Semibold, PingFang SC" font-weight="500">,2.6V</tspan>
          </text>
          <text id="变频模块">
            <tspan x="0" y="19">变频模块</tspan>
          </text>
        </g>
        <g id="编组-13备份-5" transform="translate(0.000000, 316.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42度" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.710013" y="26.5131579">42度</tspan>
          </text>
          <text id="接受电平A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接受电平A</tspan>
          </text>
        </g>
        <g id="编组-13备份-8" transform="translate(0.000000, 355.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="42%" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.980013" y="26.5131579">42%</tspan>
          </text>
          <text id="接收电平B" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">接收电平B</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 237.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">调制电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-6" transform="translate(0.000000, 395.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="221" height="39"></rect>
          <text id="0.44A,E1" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="126.7683" y="26.5131579">0.44A,E1</tspan>
          </text>
          <text id="波道" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.8678238" y="26.5131579">波道</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 276.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="5.6V" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="142.692159" y="26.5131579">5.6V</tspan>
          </text>
          <text id="发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">发射电平</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 198.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="0.20A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="138.162869" y="26.5131579">0.20A</tspan>
          </text>
          <text id="解调模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">解调模块</tspan>
          </text>
        </g>
        <text id="通道二" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#FFFFFF">
          <tspan x="92" y="26">通道二</tspan>
        </text>
        <g id="编组-2" transform="translate(0.000000, 119.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="221" height="39"></rect>
          <text id="功放模块" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="13.4252336" y="26.5131579">功放模块</tspan>
          </text>
          <text id="1.21A,锁定" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="121.368869" y="26.5131579">1.21A,锁定</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="40" width="221" height="39"></rect>
        <text id="基站信息" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="17" y="66">基站信息</tspan>
        </text>
        <text id="0.07A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="137.988" y="66">0.07A</tspan>
        </text>
      </g>
      <rect id="矩形" fill-opacity="0.1" fill="#0DA5FF" x="370" y="156" width="444" height="38"></rect>
      <rect id="矩形备份-7" fill-opacity="0.1" fill="#0DA5FF" x="830" y="156" width="444" height="38"></rect>
      <text id="MBS-A诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="552.371" y="182">MBS A诊断</tspan>
      </text>
      <text id="MBS-B诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="1012.191" y="182">MBS B诊断</tspan>
      </text>
      <line x1="1282" y1="140" x2="1282" y2="649" id="直线" stroke="#015A90" stroke-width="2" stroke-linecap="square">
      </line>
      <line x1="1892" y1="508" x2="1284" y2="508" id="直线" stroke="#015A90" stroke-width="2" stroke-linecap="square">
      </line>
      <g id="编组-7备份-5" transform="translate(1292.000000, 196.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="287" height="275"></rect>
        <g id="编组-13" transform="translate(0.000000, 39.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.00A">
            <tspan x="187.408196" y="26.5131579">0.00A</tspan>
          </text>
          <text id="网络板">
            <tspan x="17" y="27">网络板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(17.000000, 126.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.13A,PPS:00">
            <tspan x="138.181393" y="19">0.13A,PPS:00</tspan>
          </text>
          <text id="PPS板">
            <tspan x="0" y="19">PPS板</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 197.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="287" height="39"></rect>
          <text id="0.00A锁:00" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="164.561636" y="26.5131579">0.00A锁:00</tspan>
          </text>
          <text id="环网板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">环网板</tspan>
          </text>
        </g>
        <g id="编组-13备份-7" transform="translate(0.000000, 275.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="287" height="39"></rect>
          <text id="0.65A锁:03" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="164.561636" y="26.5131579">0.65A锁:03</tspan>
          </text>
          <text id="基站板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">基站板</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 236.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="0.13A,Valid:0A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="150.647514" y="26.5131579">0.13A,Valid:0A</tspan>
          </text>
          <text id="报收板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">报收板</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 158.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="0.31A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="188.528636" y="26.5131579">0.31A</tspan>
          </text>
          <text id="报处板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">报处板</tspan>
          </text>
        </g>
        <g id="编组-2" transform="translate(0.000000, 79.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="运控板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17.4345794" y="26.5131579">运控板</tspan>
          </text>
          <text id="0.00A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="186.737636" y="26.5131579">0.00A</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
        <text id="诊断板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal" fill="#FFFFFF">
          <tspan x="17" y="26">诊断板</tspan>
        </text>
        <text id="000.0A:匣:03" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="156.559" y="26">000.0A:匣:03</tspan>
        </text>
      </g>
      <g id="编组-7备份-14" transform="translate(1595.000000, 196.000000)">
        <rect id="矩形" fill="#00A1FF" opacity="0.0993289039" x="0" y="0" width="287" height="275"></rect>
        <g id="编组-13" transform="translate(0.000000, 39.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.00A">
            <tspan x="187.408196" y="26.5131579">0.00A</tspan>
          </text>
          <text id="网络板">
            <tspan x="17" y="27">网络板</tspan>
          </text>
        </g>
        <g id="编组-13备份" transform="translate(17.000000, 126.000000)" fill="#FFFFFF"
          font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal">
          <text id="0.13A,PPS:00">
            <tspan x="138.181393" y="19">0.13A,PPS:00</tspan>
          </text>
          <text id="PPS板">
            <tspan x="0" y="19">PPS板</tspan>
          </text>
        </g>
        <g id="编组-13备份-3" transform="translate(0.000000, 197.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="287" height="39"></rect>
          <text id="0.00A锁:00" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="164.561636" y="26.5131579">0.00A锁:00</tspan>
          </text>
          <text id="环网板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">环网板</tspan>
          </text>
        </g>
        <g id="编组-13备份-7" transform="translate(0.000000, 275.000000)">
          <rect id="矩形备份-6" opacity="0.100346157" x="0" y="0" width="287" height="39"></rect>
          <text id="0.65A锁:03" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="164.561636" y="26.5131579">0.65A锁:03</tspan>
          </text>
          <text id="基站板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">基站板</tspan>
          </text>
        </g>
        <g id="编组-13备份-4" transform="translate(0.000000, 236.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="0.13A,Valid:0A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="150.647514" y="26.5131579">0.13A,Valid:0A</tspan>
          </text>
          <text id="报收板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">报收板</tspan>
          </text>
        </g>
        <g id="编组-13备份-2" transform="translate(0.000000, 158.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="0.31A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="188.528636" y="26.5131579">0.31A</tspan>
          </text>
          <text id="报处板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17" y="27">报处板</tspan>
          </text>
        </g>
        <g id="编组-2" transform="translate(0.000000, 79.000000)">
          <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
          <text id="运控板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="17.4345794" y="26.5131579">运控板</tspan>
          </text>
          <text id="0.00A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
            fill="#FFFFFF">
            <tspan x="186.737636" y="26.5131579">0.00A</tspan>
          </text>
        </g>
        <rect id="矩形备份-6" fill="#00A1FF" opacity="0.1" x="0" y="0" width="287" height="39"></rect>
        <text id="诊断板" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal" fill="#FFFFFF">
          <tspan x="17" y="26">诊断板</tspan>
        </text>
        <text id="000.0A:匣:03" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="156.559" y="26">000.0A:匣:03</tspan>
        </text>
      </g>
      <rect id="矩形备份-8" fill-opacity="0.1" fill="#0DA5FF" x="1292" y="154" width="287" height="38"></rect>
      <rect id="矩形备份-9" fill-opacity="0.1" fill="#0DA5FF" x="1595" y="154" width="287" height="38"></rect>
      <text id="MRCU-A诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="1384.09" y="180">MRCU A诊断</tspan>
      </text>
      <text id="MRCU-B诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="1687.41" y="180">MRCU B诊断</tspan>
      </text>
      <rect id="矩形备份-17" fill-opacity="0.1" fill="#0DA5FF" x="1595" y="512" width="287" height="38"></rect>
      <rect id="矩形备份-20" fill-opacity="0.1" fill="#0DA5FF" x="1292" y="512" width="287" height="38"></rect>
      <g id="编组-4" transform="translate(1292.000000, 554.000000)">
        <rect id="矩形备份-21" fill-opacity="0.1" fill="#0DA5FF" x="0" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-22" fill-opacity="0.1" fill="#0DA5FF" x="36" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-30" fill-opacity="0.5" fill="#0DD6FF" x="72" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-31" fill-opacity="0.5" fill="#0DD6FF" x="108" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-32" fill-opacity="0.1" fill="#0DA5FF" x="145" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-33" fill-opacity="0.1" fill="#0DA5FF" x="181" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-34" fill-opacity="0.1" fill="#0DA5FF" x="217" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-35" fill-opacity="0.1" fill="#0DA5FF" x="253" y="0" width="34" height="90"></rect>
        <text id="诊-断-板" opacity="0.602733794" font-family="PingFangSC-Regular, PingFang SC" font-size="20"
          font-weight="normal" line-spacing="26" fill="#FFFFFF">
          <tspan x="7" y="27">诊</tspan>
          <tspan x="7" y="53">断</tspan>
          <tspan x="7" y="79">板</tspan>
        </text>
        <text id="网-络-板" opacity="0.602733794" font-family="PingFangSC-Regular, PingFang SC" font-size="20"
          font-weight="normal" line-spacing="26" fill="#FFFFFF">
          <tspan x="43" y="27">网</tspan>
          <tspan x="43" y="53">络</tspan>
          <tspan x="43" y="79">板</tspan>
        </text>
        <text id="运-控-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF">
          <tspan x="79" y="27">运</tspan>
          <tspan x="79" y="53">控</tspan>
          <tspan x="79" y="79">板</tspan>
        </text>
        <text id="P-P-S-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="18" fill="#FFFFFF">
          <tspan x="118.58" y="31">P</tspan>
          <tspan x="118.58" y="49">P</tspan>
          <tspan x="118.68" y="67">S</tspan>
          <tspan x="115" y="85">板</tspan>
        </text>
        <text id="报-处-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="152" y="27">报</tspan>
          <tspan x="152" y="53">处</tspan>
          <tspan x="152" y="79">板</tspan>
        </text>
        <text id="环-网-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="188" y="27">环</tspan>
          <tspan x="188" y="53">网</tspan>
          <tspan x="188" y="79">板</tspan>
        </text>
        <text id="报-收-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="224" y="27">报</tspan>
          <tspan x="224" y="53">收</tspan>
          <tspan x="224" y="79">板</tspan>
        </text>
        <text id="基-站-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="260" y="27">基</tspan>
          <tspan x="260" y="53">站</tspan>
          <tspan x="260" y="79">板</tspan>
        </text>
      </g>
      <g id="编组-4备份" transform="translate(1595.000000, 554.000000)">
        <rect id="矩形备份-21" fill-opacity="0.1" fill="#0DA5FF" x="0" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-22" fill-opacity="0.1" fill="#0DA5FF" x="36" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-30" fill-opacity="0.5" fill="#0DD6FF" x="72" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-31" fill-opacity="0.5" fill="#0DD6FF" x="108" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-32" fill-opacity="0.1" fill="#0DA5FF" x="145" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-33" fill-opacity="0.1" fill="#0DA5FF" x="181" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-34" fill-opacity="0.1" fill="#0DA5FF" x="217" y="0" width="34" height="90"></rect>
        <rect id="矩形备份-35" fill-opacity="0.1" fill="#0DA5FF" x="253" y="0" width="34" height="90"></rect>
        <text id="诊-断-板" opacity="0.602733794" font-family="PingFangSC-Regular, PingFang SC" font-size="20"
          font-weight="normal" line-spacing="26" fill="#FFFFFF">
          <tspan x="7" y="27">诊</tspan>
          <tspan x="7" y="53">断</tspan>
          <tspan x="7" y="79">板</tspan>
        </text>
        <text id="网-络-板" opacity="0.602733794" font-family="PingFangSC-Regular, PingFang SC" font-size="20"
          font-weight="normal" line-spacing="26" fill="#FFFFFF">
          <tspan x="43" y="27">网</tspan>
          <tspan x="43" y="53">络</tspan>
          <tspan x="43" y="79">板</tspan>
        </text>
        <text id="运-控-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF">
          <tspan x="79" y="27">运</tspan>
          <tspan x="79" y="53">控</tspan>
          <tspan x="79" y="79">板</tspan>
        </text>
        <text id="P-P-S-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="18" fill="#FFFFFF">
          <tspan x="118.58" y="31">P</tspan>
          <tspan x="118.58" y="49">P</tspan>
          <tspan x="118.68" y="67">S</tspan>
          <tspan x="115" y="85">板</tspan>
        </text>
        <text id="报-处-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="152" y="27">报</tspan>
          <tspan x="152" y="53">处</tspan>
          <tspan x="152" y="79">板</tspan>
        </text>
        <text id="环-网-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="188" y="27">环</tspan>
          <tspan x="188" y="53">网</tspan>
          <tspan x="188" y="79">板</tspan>
        </text>
        <text id="报-收-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="224" y="27">报</tspan>
          <tspan x="224" y="53">收</tspan>
          <tspan x="224" y="79">板</tspan>
        </text>
        <text id="基-站-板" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          line-spacing="26" fill="#FFFFFF" fill-opacity="0.6">
          <tspan x="260" y="27">基</tspan>
          <tspan x="260" y="53">站</tspan>
          <tspan x="260" y="79">板</tspan>
        </text>
      </g>
      <text id="MRCU-B组匣" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="1688.91" y="538">MRCU B组匣</tspan>
      </text>
      <text id="MRCU-A组匣" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
        fill="#FFFFFF">
        <tspan x="1386.09" y="538">MRCU A组匣</tspan>
      </text>
      <rect id="矩形备份-5" stroke="#015A90" stroke-width="2" fill-opacity="0.07" fill="#00A1FF" x="25" y="426" width="305"
        height="224"></rect>
      <g id="编组-7备份-6" transform="translate(38.000000, 498.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="基站通信A" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="23.087" y="28">基站通信A</tspan>
        </text>
      </g>
      <g id="编组-7备份-7" transform="translate(184.000000, 498.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="基站通信B" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="22.907" y="28">基站通信B</tspan>
        </text>
      </g>
      <g id="编组-7备份-10" transform="translate(38.000000, 572.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="车载环网" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="29" y="28">车载环网</tspan>
        </text>
      </g>
      <g id="编组-7备份-11" transform="translate(184.000000, 572.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="自诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal" fill="#FFFFFF">
          <tspan x="38" y="28">自诊断</tspan>
        </text>
      </g>
      <rect id="矩形" stroke="#015A90" stroke-width="2" fill-opacity="0.07" fill="#00A1FF" x="25" y="103" width="305"
        height="297"></rect>
      <g id="编组-7" transform="translate(38.000000, 175.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="PRW业务" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="26.768" y="28">PRW业务</tspan>
        </text>
      </g>
      <g id="编组-7备份-4" transform="translate(184.000000, 175.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="运控业务" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="29" y="28">运控业务</tspan>
        </text>
      </g>
      <g id="编组-7备份-8" transform="translate(38.000000, 249.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="诊断网业务" font-family="PingFangSC-Medium, PingFang SC" font-size="18" font-weight="400" fill="#FFFFFF">
          <tspan x="20" y="28">诊断网业务</tspan>
        </text>
      </g>
      <g id="编组-7备份-12" transform="translate(38.000000, 323.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="调度业务" font-family="PingFangSC-Medium, PingFang SC" font-size="18" font-weight="400" fill="#FFFFFF">
          <tspan x="29" y="28">调度业务</tspan>
        </text>
      </g>
      <g id="编组-7备份-9" transform="translate(184.000000, 249.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="PIS业务" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="33.401" y="28">PIS业务</tspan>
        </text>
      </g>
      <g id="编组-7备份-13" transform="translate(184.000000, 323.000000)">
        <rect id="矩形" fill="#0DD6FF" opacity="0.501344227" x="0" y="0" width="130" height="42"></rect>
        <text id="自诊断业务" font-family="PingFangSC-Regular, PingFang SC" font-size="18" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="20" y="28">自诊断业务</tspan>
        </text>
      </g>
      <g id="编组-5" transform="translate(24.000000, 102.000000)">
        <rect id="矩形" fill="#00A1FF" x="0" y="1" width="3" height="36"></rect>
        <rect id="矩形备份-4" fill="url(#linearGradient-1)" opacity="0.369679769" x="3" y="0" width="302" height="37">
        </rect>
        <text id="车载无线通信业务" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="34" y="27">车载无线通信业务</tspan>
        </text>
        <g id="编组" transform="translate(260.000000, 13.000000)" fill="#4EB3FE">
          <polygon id="矩形" opacity="0.220115298" points="11 0 15.516129 0 25 12 20.483871 12"></polygon>
          <polygon id="矩形备份" points="-4.10752078e-13 0 4.51612903 0 14 12 9.48387097 12"></polygon>
        </g>
        <g id="上箭头"
          transform="translate(22.000000, 20.000000) rotate(-270.000000) translate(-22.000000, -20.000000) translate(16.000000, 14.000000)"
          fill="#FFFFFF" fill-rule="nonzero">
          <rect id="矩形" opacity="0" x="0" y="0" width="12" height="12"></rect>
          <path
            d="M6.7155,3.1875 L10.33425,7.929 C10.5419684,8.2011872 10.5772501,8.56766184 10.4252743,8.874478 C10.2732984,9.18129416 9.96039265,9.37530038 9.618,9.37500035 L2.381625,9.37500035 C2.03936752,9.37500035 1.72672265,9.18089984 1.57493463,8.87414166 C1.42314661,8.56738348 1.45848879,8.20107975 1.666125,7.929 L5.284875,3.1875 C5.45513546,2.9645217 5.71963814,2.83369413 6.0001875,2.83369413 C6.28073686,2.83369413 6.54523954,2.9645217 6.7155,3.1875 Z"
            id="路径"></path>
        </g>
      </g>
      <g id="编组-5备份-4" transform="translate(24.000000, 425.000000)">
        <rect id="矩形" fill="#00A1FF" x="0" y="1" width="3" height="36"></rect>
        <rect id="矩形备份-4" fill="url(#linearGradient-2)" opacity="0.369679769" x="3" y="0" width="303" height="37">
        </rect>
        <text id="车载无线通信状态" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="34" y="27">车载无线通信状态</tspan>
        </text>
        <g id="编组" transform="translate(261.000000, 13.000000)" fill="#4EB3FE">
          <polygon id="矩形" opacity="0.220115298" points="11 0 15.516129 0 25 12 20.483871 12"></polygon>
          <polygon id="矩形备份" points="-4.10752078e-13 0 4.51612903 0 14 12 9.48387097 12"></polygon>
        </g>
        <g id="上箭头"
          transform="translate(22.000000, 20.000000) rotate(-270.000000) translate(-22.000000, -20.000000) translate(16.000000, 14.000000)"
          fill="#FFFFFF" fill-rule="nonzero">
          <rect id="矩形" opacity="0" x="0" y="0" width="12" height="12"></rect>
          <path
            d="M6.7155,3.1875 L10.33425,7.929 C10.5419684,8.2011872 10.5772501,8.56766184 10.4252743,8.874478 C10.2732984,9.18129416 9.96039265,9.37530038 9.618,9.37500035 L2.381625,9.37500035 C2.03936752,9.37500035 1.72672265,9.18089984 1.57493463,8.87414166 C1.42314661,8.56738348 1.45848879,8.20107975 1.666125,7.929 L5.284875,3.1875 C5.45513546,2.9645217 5.71963814,2.83369413 6.0001875,2.83369413 C6.28073686,2.83369413 6.54523954,2.9645217 6.7155,3.1875 Z"
            id="路径"></path>
        </g>
      </g>
      <g id="编组-5备份" transform="translate(355.000000, 102.000000)">
        <rect id="矩形" fill="#00A1FF" x="0" y="1" width="3.00242131" height="36"></rect>
        <rect id="矩形备份-4" fill="url(#linearGradient-3)" opacity="0.37" x="3.00242131" y="0" width="1536" height="38">
        </rect>
        <text id="38G车载关键设备诊断" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="30.0242131" y="27">38G车载关键设备诊断</tspan>
        </text>
        <g id="编组" transform="translate(1495.409201, 13.000000)" fill="#4EB3FE">
          <polygon id="矩形" opacity="0.220115298" points="9.97030472 0 14.5022614 0 24.0193705 13 19.4874138 13">
          </polygon>
          <polygon id="矩形备份" points="-4.12191639e-13 0 4.53195669 0 14.0490657 13 9.51710905 13"></polygon>
        </g>
        <g id="上箭头"
          transform="translate(19.515738, 20.000000) rotate(-270.000000) translate(-19.515738, -20.000000) translate(14.011299, 14.000000)"
          fill="#FFFFFF" fill-rule="nonzero">
          <rect id="矩形" opacity="0" x="0" y="0" width="11.0088781" height="12"></rect>
          <path
            d="M6.16084342,3.1875 L9.48070823,7.929 C9.67127046,8.2011872 9.70363815,8.56766184 9.56421451,8.874478 C9.42479088,9.18129416 9.13772906,9.37530038 8.82361582,9.37500035 L2.18491828,9.37500035 C1.87092904,9.37500035 1.5841066,9.18089984 1.44485528,8.87414166 C1.30560396,8.56738348 1.33802712,8.20107975 1.52851392,7.929 L4.84837873,3.1875 C5.00457679,2.9645217 5.24723326,2.83369413 5.50461108,2.83369413 C5.76198889,2.83369413 6.00464537,2.9645217 6.16084342,3.1875 Z"
            id="路径"></path>
        </g>
      </g>
      <g id="编组-6备份-4" transform="translate(24.000000, 675.000000)" fill="#00A1FF" fill-opacity="0.07" stroke="#015A90"
        stroke-width="2">
        <rect id="矩形" x="1" y="1" width="1870" height="378"></rect>
      </g>
      <g id="编组-8备份-24" transform="translate(48.000000, 725.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-A变频模块电流" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS A变频模块电流</tspan>
        </text>
        <g id="编组-9" transform="translate(322.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13.2600334,43.2479734 C20.1631081,47.8333393 28.5454131,50.1260222 38.4069484,50.1260222 C53.1992514,50.1260222 93.1384693,35.1260222 118.285384,35.1260222 C143.432299,35.1260222 171.006165,46.5406563 195.20536,46.5406563 C219.404554,46.5406563 232.679194,36.8821198 260.291492,36.8821198 C287.903791,36.8821198 295.302952,50.1260222 311.568105,50.1260222 C327.833257,50.1260222 358.61881,39.3576883 380.318102,41.0101479 C394.784297,42.1117877 407.205923,45.1504124 417.58298,50.1260222"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.421507, 42.626022) scale(1, -1) translate(-215.421507, -42.626022) "></path>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.5" cy="40.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-28" transform="translate(48.000000, 890.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-B变频模块电流" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS B变频模块电流</tspan>
        </text>
        <g id="编组-9" transform="translate(322.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13.2600334,43.2479734 C20.1631081,47.8333393 28.5454131,50.1260222 38.4069484,50.1260222 C53.1992514,50.1260222 93.1384693,35.1260222 118.285384,35.1260222 C143.432299,35.1260222 171.006165,46.5406563 195.20536,46.5406563 C219.404554,46.5406563 232.679194,36.8821198 260.291492,36.8821198 C287.903791,36.8821198 295.302952,50.1260222 311.568105,50.1260222 C327.833257,50.1260222 358.61881,39.3576883 380.318102,41.0101479 C394.784297,42.1117877 407.205923,45.1504124 417.58298,50.1260222"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.421507, 42.626022) scale(1, -1) translate(-215.421507, -42.626022) "></path>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.5" cy="40.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-25" transform="translate(510.000000, 725.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-A解调模块电流" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS A解调模块电流</tspan>
        </text>
        <g id="编组-9" transform="translate(321.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M14,35.4522526 C20.9030747,40.0376185 29.2853797,42.3303014 39.146915,42.3303014 C53.9392179,42.3303014 93.8784358,27.3303014 119.025351,27.3303014 C144.172266,27.3303014 171.746132,38.7449356 195.945326,38.7449356 C220.144521,38.7449356 233.41916,29.086399 261.031459,29.086399 C288.643758,29.086399 296.042919,42.3303014 312.308071,42.3303014 C328.573223,42.3303014 359.358776,31.5619675 381.058069,33.2144271 C395.524263,34.3160669 407.945889,37.3546917 418.322947,42.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(216.161473, 34.830301) scale(1, -1) translate(-216.161473, -34.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="177.239967" cy="32.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-29" transform="translate(510.000000, 890.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-B解调模块电流" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS B解调模块电流</tspan>
        </text>
        <g id="编组-9" transform="translate(321.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M14,35.4522526 C20.9030747,40.0376185 29.2853797,42.3303014 39.146915,42.3303014 C53.9392179,42.3303014 93.8784358,27.3303014 119.025351,27.3303014 C144.172266,27.3303014 171.746132,38.7449356 195.945326,38.7449356 C220.144521,38.7449356 233.41916,29.086399 261.031459,29.086399 C288.643758,29.086399 296.042919,42.3303014 312.308071,42.3303014 C328.573223,42.3303014 359.358776,31.5619675 381.058069,33.2144271 C395.524263,34.3160669 407.945889,37.3546917 418.322947,42.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(216.161473, 34.830301) scale(1, -1) translate(-216.161473, -34.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="177.239967" cy="32.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-26" transform="translate(972.000000, 725.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-A调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS A调制电平</tspan>
        </text>
        <g id="编组-9" transform="translate(326.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13,46.4522526 C19.9030747,51.0376185 28.2853797,53.3303014 38.146915,53.3303014 C52.9392179,53.3303014 92.8784358,38.3303014 118.025351,38.3303014 C143.172266,38.3303014 170.746132,49.7449356 194.945326,49.7449356 C219.144521,49.7449356 232.41916,40.086399 260.031459,40.086399 C287.643758,40.086399 295.042919,53.3303014 311.308071,53.3303014 C327.573223,53.3303014 358.358776,42.5619675 380.058069,44.2144271 C394.524263,45.3160669 406.945889,48.3546917 417.322947,53.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.161473, 45.830301) scale(1, -1) translate(-215.161473, -45.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.239967" cy="43.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-30" transform="translate(972.000000, 890.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-B调制电平" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS B调制电平</tspan>
        </text>
        <g id="编组-9" transform="translate(326.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="57" y1="9" x2="66" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1</tspan>
          </text>
          <text id="通道2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="70" y="13">通道2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13,46.4522526 C19.9030747,51.0376185 28.2853797,53.3303014 38.146915,53.3303014 C52.9392179,53.3303014 92.8784358,38.3303014 118.025351,38.3303014 C143.172266,38.3303014 170.746132,49.7449356 194.945326,49.7449356 C219.144521,49.7449356 232.41916,40.086399 260.031459,40.086399 C287.643758,40.086399 295.042919,53.3303014 311.308071,53.3303014 C327.573223,53.3303014 358.358776,42.5619675 380.058069,44.2144271 C394.524263,45.3160669 406.945889,48.3546917 417.322947,53.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.161473, 45.830301) scale(1, -1) translate(-215.161473, -45.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.239967" cy="43.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-27" transform="translate(1434.000000, 725.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-A发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS A发射电平</tspan>
        </text>
        <g id="编组-9" transform="translate(167.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="67" y1="9" x2="76" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1-1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1-1</tspan>
          </text>
          <text id="通道1-2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="80" y="13">通道1-2</tspan>
          </text>
        </g>
        <g id="编组-9备份" transform="translate(302.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#F45C54" stroke-width="2" stroke-linecap="square"></line>
          <line x1="67" y1="9" x2="76" y2="9" id="直线-2备份" stroke="#FFBF46" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道2-1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道2-1</tspan>
          </text>
          <text id="通道2-2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="80" y="13">通道2-2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13,44.4522526 C19.9030747,49.0376185 28.2853797,51.3303014 38.146915,51.3303014 C52.9392179,51.3303014 92.8784358,36.3303014 118.025351,36.3303014 C143.172266,36.3303014 170.746132,47.7449356 194.945326,47.7449356 C219.144521,47.7449356 232.41916,38.086399 260.031459,38.086399 C287.643758,38.086399 295.042919,51.3303014 311.308071,51.3303014 C327.573223,51.3303014 358.358776,40.5619675 380.058069,42.2144271 C394.524263,43.3160669 406.945889,46.3546917 417.322947,51.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.161473, 43.830301) scale(1, -1) translate(-215.161473, -43.830301) "></path>
          <path
            d="M13,38.9498136 C19.9030747,47.2034721 28.2853797,51.3303014 38.146915,51.3303014 C52.9392179,51.3303014 92.8784358,24.3303014 118.025351,24.3303014 C143.172266,24.3303014 170.746132,44.8766429 194.945326,44.8766429 C219.144521,44.8766429 232.41916,27.491277 260.031459,27.491277 C287.643758,27.491277 295.042919,51.3303014 311.308071,51.3303014 C327.573223,51.3303014 358.358776,31.9473004 380.058069,34.9217277 C394.524263,36.9046793 406.945889,42.3742039 417.322947,51.3303014"
            id="路径-8备份-3" stroke="#FFBF46" stroke-width="2"
            transform="translate(215.161473, 37.830301) scale(1, -1) translate(-215.161473, -37.830301) "></path>
          <path
            d="M13,53.1156673 C19.9030747,62.59209 28.2853797,67.3303014 38.146915,67.3303014 C52.9392179,67.3303014 92.8784358,36.3303014 118.025351,36.3303014 C143.172266,36.3303014 170.746132,59.9205453 194.945326,59.9205453 C219.144521,59.9205453 232.41916,39.9595697 260.031459,39.9595697 C287.643758,39.9595697 295.042919,67.3303014 311.308071,67.3303014 C327.573223,67.3303014 358.358776,45.0757447 380.058069,48.4908279 C394.524263,50.7675501 406.945889,57.0473746 417.322947,67.3303014"
            id="路径-8备份-3" stroke="#F45C54" stroke-width="2"
            transform="translate(215.161473, 51.830301) scale(1, -1) translate(-215.161473, -51.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.239967" cy="41.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-8备份-31" transform="translate(1434.000000, 890.000000)">
        <rect id="矩形" stroke="#00A1FF" opacity="0.500722976" x="0.5" y="0.5" width="437" height="152"></rect>
        <text id="MBS-B发射电平" font-family="PingFangSC-Regular, PingFang SC" font-size="16" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="9" y="23.1055901">MBS B发射电平</tspan>
        </text>
        <g id="编组-9" transform="translate(167.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#0DD6FF" stroke-width="2" stroke-linecap="square"></line>
          <line x1="67" y1="9" x2="76" y2="9" id="直线-2备份" stroke="#00A1FF" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道1-1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道1-1</tspan>
          </text>
          <text id="通道1-2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="80" y="13">通道1-2</tspan>
          </text>
        </g>
        <g id="编组-9备份" transform="translate(302.000000, 9.000000)">
          <line x1="0" y1="9" x2="9" y2="9" id="直线-2" stroke="#F45C54" stroke-width="2" stroke-linecap="square"></line>
          <line x1="67" y1="9" x2="76" y2="9" id="直线-2备份" stroke="#FFBF46" stroke-width="2" stroke-linecap="square">
          </line>
          <text id="通道2-1" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="13" y="13">通道2-1</tspan>
          </text>
          <text id="通道2-2" font-family="PingFangSC-Regular, PingFang SC" font-size="12" font-weight="normal"
            fill="#749DC0">
            <tspan x="80" y="13">通道2-2</tspan>
          </text>
        </g>
        <g id="编组-8备份-7" transform="translate(9.000000, 34.669699)">
          <line x1="418.507024" y1="90.8167485" x2="13.2806697" y2="90.8167485" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square"></line>
          <line x1="418.507024" y1="52.7406206" x2="13.2806697" y2="52.7406206" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="418.507024" y1="8.63298995" x2="13.2806697" y2="8.63298995" id="直线-7备份-5" stroke="#ACCFF1"
            opacity="0.35" stroke-linecap="square" stroke-dasharray="4"></line>
          <line x1="176.5" y1="90.8303014" x2="176.5" y2="8.83030141" id="直线-7备份-7" stroke="#ACCFF1" opacity="0.35"
            stroke-linecap="square" stroke-dasharray="4"></line>
          <text id="0备份" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="0" y="92.1497194">0</tspan>
          </text>
          <text id="00:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="13.3250883" y="107.16992">00:00</tspan>
          </text>
          <text id="01:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="87.2517079" y="107.16992">01:00</tspan>
          </text>
          <text id="02:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="158.178327" y="107.16992">02:00</tspan>
          </text>
          <text id="03:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="232.104947" y="107.16992">03:00</tspan>
          </text>
          <text id="04:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="306.031567" y="107.16992">04:00</tspan>
          </text>
          <text id="05:00" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal"
            fill="#749DC0">
            <tspan x="379.958186" y="107.16992">05:00</tspan>
          </text>
          <text id="1" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="53.1101023">1</tspan>
          </text>
          <text id="2" font-family="PingFangSC-Regular, PingFang SC" font-size="14" font-weight="normal" fill="#749DC0">
            <tspan x="0" y="15">2</tspan>
          </text>
          <path
            d="M13.2600334,47.1302924 C20.1631081,60.4607789 28.5454131,67.1260222 38.4069484,67.1260222 C53.1992514,67.1260222 93.1384693,23.5183136 118.285384,23.5183136 C143.432299,23.5183136 171.006165,56.7027162 195.20536,56.7027162 C219.404554,56.7027162 232.679194,28.6236063 260.291492,28.6236063 C287.903791,28.6236063 295.302952,67.1260222 311.568105,67.1260222 C327.833257,67.1260222 358.61881,35.820531 380.318102,40.6245296 C394.784297,43.8271953 407.205923,52.6610262 417.58298,67.1260222"
            id="路径-8备份-2" stroke="#00A1FF" stroke-width="2"></path>
          <path
            d="M13,44.4522526 C19.9030747,49.0376185 28.2853797,51.3303014 38.146915,51.3303014 C52.9392179,51.3303014 92.8784358,36.3303014 118.025351,36.3303014 C143.172266,36.3303014 170.746132,47.7449356 194.945326,47.7449356 C219.144521,47.7449356 232.41916,38.086399 260.031459,38.086399 C287.643758,38.086399 295.042919,51.3303014 311.308071,51.3303014 C327.573223,51.3303014 358.358776,40.5619675 380.058069,42.2144271 C394.524263,43.3160669 406.945889,46.3546917 417.322947,51.3303014"
            id="路径-8备份-3" stroke="#0DD6FF" stroke-width="2"
            transform="translate(215.161473, 43.830301) scale(1, -1) translate(-215.161473, -43.830301) "></path>
          <path
            d="M13,38.9498136 C19.9030747,47.2034721 28.2853797,51.3303014 38.146915,51.3303014 C52.9392179,51.3303014 92.8784358,24.3303014 118.025351,24.3303014 C143.172266,24.3303014 170.746132,44.8766429 194.945326,44.8766429 C219.144521,44.8766429 232.41916,27.491277 260.031459,27.491277 C287.643758,27.491277 295.042919,51.3303014 311.308071,51.3303014 C327.573223,51.3303014 358.358776,31.9473004 380.058069,34.9217277 C394.524263,36.9046793 406.945889,42.3742039 417.322947,51.3303014"
            id="路径-8备份-3" stroke="#FFBF46" stroke-width="2"
            transform="translate(215.161473, 37.830301) scale(1, -1) translate(-215.161473, -37.830301) "></path>
          <path
            d="M13,53.1156673 C19.9030747,62.59209 28.2853797,67.3303014 38.146915,67.3303014 C52.9392179,67.3303014 92.8784358,36.3303014 118.025351,36.3303014 C143.172266,36.3303014 170.746132,59.9205453 194.945326,59.9205453 C219.144521,59.9205453 232.41916,39.9595697 260.031459,39.9595697 C287.643758,39.9595697 295.042919,67.3303014 311.308071,67.3303014 C327.573223,67.3303014 358.358776,45.0757447 380.058069,48.4908279 C394.524263,50.7675501 406.945889,57.0473746 417.322947,67.3303014"
            id="路径-8备份-3" stroke="#F45C54" stroke-width="2"
            transform="translate(215.161473, 51.830301) scale(1, -1) translate(-215.161473, -51.830301) "></path>
          <circle id="椭圆形备份" stroke="#FFFFFF" fill="#0DD6FF" cx="176.239967" cy="41.7042792" r="4"></circle>
          <circle id="椭圆形" stroke="#FFFFFF" fill="#00A1FF" cx="176.5" cy="51.5" r="4"></circle>
        </g>
      </g>
      <g id="编组-5备份-3" transform="translate(24.000000, 675.000000)">
        <rect id="矩形" fill="#0D98FF" x="0" y="1" width="3" height="36"></rect>
        <rect id="矩形备份-4" fill="url(#linearGradient-4)" opacity="0.37" x="3" y="0" width="1869" height="38"></rect>
        <text id="状态曲线" font-family="PingFangSC-Regular, PingFang SC" font-size="20" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="34" y="27">状态曲线</tspan>
        </text>
        <g id="编组" transform="translate(1825.146667, 13.000000)" fill="#4EB3FE">
          <polygon id="矩形" opacity="0.220115298" points="11.1466667 0 16.2133333 0 26.8533333 13 21.7866667 13">
          </polygon>
          <polygon id="矩形备份" points="-4.60824712e-13 0 5.06666667 0 15.7066667 13 10.64 13"></polygon>
        </g>
        <g id="上箭头"
          transform="translate(22.000000, 20.000000) rotate(-270.000000) translate(-22.000000, -20.000000) translate(16.000000, 14.000000)"
          fill="#FFFFFF" fill-rule="nonzero">
          <rect id="矩形" opacity="0" x="0" y="0" width="12" height="12"></rect>
          <path
            d="M6.7155,3.1875 L10.33425,7.929 C10.5419684,8.2011872 10.5772501,8.56766184 10.4252743,8.874478 C10.2732984,9.18129416 9.96039265,9.37530038 9.618,9.37500035 L2.381625,9.37500035 C2.03936752,9.37500035 1.72672265,9.18089984 1.57493463,8.87414166 C1.42314661,8.56738348 1.45848879,8.20107975 1.666125,7.929 L5.284875,3.1875 C5.45513546,2.9645217 5.71963814,2.83369413 6.0001875,2.83369413 C6.28073686,2.83369413 6.54523954,2.9645217 6.7155,3.1875 Z"
            id="路径"></path>
        </g>
      </g>
      <g id="编组-4备份-8">
        <g id="编组-3">
          <g id="编组-20">
            <rect id="矩形备份-2" fill="url(#linearGradient-5)" x="0" y="0" width="1920" height="59"></rect>
            <g id="编组-6" transform="translate(589.000000, 0.000000)">
              <polyline id="路径备份" fill="url(#linearGradient-6)" points="712.506849 0 649.767123 78 87.739726 78 25 0">
              </polyline>
              <g id="编组" transform="translate(0.000000, 52.000000)" fill="#4EB3FE">
                <polygon id="矩形" points="44 0 54 0 75 26 65 26"></polygon>
                <polygon id="矩形备份" opacity="0.597190494" points="22 0 32 0 53 26 43 26"></polygon>
                <polygon id="矩形备份-3" opacity="0.310084025" points="-9.09522457e-13 0 10 0 31 26 21 26"></polygon>
              </g>
              <g id="编组备份"
                transform="translate(704.500000, 65.000000) scale(-1, 1) translate(-704.500000, -65.000000) translate(667.000000, 52.000000)"
                fill="#4EB3FE">
                <polygon id="矩形" points="44 0 54 0 75 26 65 26"></polygon>
                <polygon id="矩形备份" opacity="0.597190494" points="22 0 32 0 53 26 43 26"></polygon>
                <polygon id="矩形备份-3" opacity="0.310084025" points="-9.09522457e-13 0 10 0 31 26 21 26"></polygon>
              </g>
            </g>
          </g>
          <!-- 时间模块 -->
          <text fill="#ffffff" font-family="SimHei" font-size="40" font-weight="400" height="56"
            letter-spacing="1.81818182" width="544" :text-anchor="titleProps.anchor">
            <tspan :x="titleProps.x" y="55">{{ title }}</tspan>
          </text>
        </g>
        <text id="异常" font-family="PingFangSC-Regular, PingFang SC" font-size="22" font-weight="normal" fill="#F45C54">
          <tspan x="1574" y="38">异常</tspan>
        </text>
        <circle id="椭圆形" fill="#F45C54" cx="1551" cy="31" r="11"></circle>
        <text id="车号：CF001" font-family="PingFangSC-Regular, PingFang SC" font-size="22" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="202" y="39">车号：CF001</tspan>
        </text>
        <g id="caret-right" transform="translate(344.000000, 25.000000)" fill="#FFFFFF" fill-rule="nonzero">
          <rect id="矩形" opacity="0" x="0" y="0" width="16" height="16"></rect>
          <path
            d="M11.184375,7.7109375 L5.234375,2.5796875 C5.0125,2.3890625 4.6875,2.5609375 4.6875,2.86875 L4.6875,13.13125 C4.6875,13.4390625 5.0125,13.6109375 5.234375,13.4203125 L11.184375,8.2890625 C11.3546875,8.1421875 11.3546875,7.8578125 11.184375,7.7109375 Z"
            id="路径"></path>
        </g>
        <!-- logo 图标（可配置，支持一行多个，默认左上角原位置） -->
        <image v-for="(logo, index) in logoItems" :key="index" :height="logo.height" :width="logo.width" :x="logo.x"
          :y="logo.y" :xlink:href="logo.src" />
        <text id="12:28:00" font-family="PingFangSC-Regular, PingFang SC" font-size="22" font-weight="normal"
          fill="#FFFFFF">
          <tspan x="1648" y="38">{{ x_TimeData.nowTime }}</tspan>
        </text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.routeStep {
  position: absolute;
  top: 10px;
  left: 20px;
}

.bgBackground {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: -100;
  background-image: url(../assets/bg2.jpg);
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 100% 100%;
}

.SpeedStyle0 {
  position: absolute;
  top: 880px;
  left: 50px;
}

.SpeedStyle1 {
  position: absolute;
  top: 880px;
  left: 515px;
}

.SpeedStyle2 {
  position: absolute;
  top: 880px;
  left: 973px;
}

.SpeedStyle3 {
  position: absolute;
  top: 880px;
  left: 1420px;
}

#button1 {
  position: absolute;
  top: 575px;
  left: 1150px;
}
</style>
