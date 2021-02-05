const { app, BrowserWindow, Menu } = require('electron')

String.prototype.trim = function (char, type) {
    if (char) {
        if (type === 'left') {
            return this.replace(new RegExp('^\\'+char+'+', 'g'), '');
        } else if (type === 'right') {
            return this.replace(new RegExp('\\'+char+'+$', 'g'), '');
        }
        return this.replace(new RegExp('^\\'+char+'+|\\'+char+'+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};

// 窗口可通过命令行可设置参数
const allowWinSettings=[
    'x', 'y', 'width', 'height', 'useContentSize', 'center', 'minHeight', 'maxWidth', 'maxHeight',
    'resizable', 'movable', 'minimizable', 'maximizable', 'closable', 'focusable', 'alwaysOnTop', 'fullscreen',
    'fullscreenable', 'simpleFullscreen', 'skipTaskbar', 'kiosk', 'titleString', 'icon', 'show',
    'paintWhenInitiallyHiddenBoolean', 'frame', 'parent', 'modal', 'acceptFirstMouse', 'disableAutoHideCursor',
    'autoHideMenuBar', 'enableLargerThanScreen', 'backgroundColor', 'hasShadow', 'opacity', 'darkTheme',
    'transparent', 'type', 'visualEffectState', 'followWindow', 'active', 'inactive', 'titleBarStyle'
]

/**
 * 分析应用参数
 * @returns {{}} 返回map形式参数
 */
function analyseAppParams() {
    const args = process.argv.slice(2) || []
    let argMap = {}

    for (const arg of args) {
        const eqIndex = arg.indexOf('=')
        let kvArr = []
        if (eqIndex !== -1) {
            let k = arg.substring(0, eqIndex)
            let v = arg.substring(eqIndex+1, arg.length)
            v = (v || '').trim('"').trim("'")
            if (/^true$|^false$/.test(v.toLowerCase())) {
                v = 'true' === v.toLowerCase()
            } else if (/^[0-9]+$/.test(v)) {
                v = parseInt(v)
            } else if (/^[0-9]+\.?[0-9]*$/.test(v)) {
                v = parseFloat(v)
            }
            kvArr = [k, v]
        } else {
            kvArr = [arg, true]
        }
        argMap[kvArr[0]] = kvArr[1]
    }

    return argMap
}

// 获取应用参数
const appParams = analyseAppParams()

function createWindow () {
    let bwsetting = {// 默认参数
        width: 800,
        height: 600,
        maximizable: true,
        webPreferences: {
            nodeIntegration: true // 是否整合node
        }
    }

    for (const settingKey in appParams) { // 设置参数
        if (allowWinSettings.indexOf(settingKey) !== -1) {
            bwsetting[settingKey] = appParams[settingKey]
        }
    }

    if (appParams['file'] || appParams['url']) {
        //  使用三方node，一般不整合nodejs
        bwsetting.webPreferences.nodeIntegration = false
    }

    if ((!('hideMenu' in appParams)) || appParams['hideMenu']) { // 是否隐藏菜单
        Menu.setApplicationMenu(null) // 隐藏所有菜单
    }

    const win = new BrowserWindow(bwsetting)

    // 最大化窗口
    if (appParams['maximize']) {
        win.maximize()
    }

    if (!appParams['icon']) {
        appParams['icon'] = './icon.png'
    }

    const loadOption = {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36', // 伪造浏览器
        httpReferrer: 'http://www.baidu.com/'
    }
    if (appParams['file']) {
        win.loadFile(appParams['file'], loadOption)
    } else if (appParams['url']) {
        win.loadURL(appParams['url'], loadOption)
    } else {
        win.loadFile('index.html', loadOption)
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})