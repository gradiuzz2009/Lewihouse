package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var currentWebView: WebView? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val intent = result.data
            val uris: Array<Uri>? = when {
                intent?.data != null -> arrayOf(intent.data!!)
                intent?.clipData != null -> {
                    val count = intent.clipData!!.itemCount
                    Array(count) { i -> intent.clipData!!.getItemAt(i).uri }
                }
                else -> null
            }
            fileChooserCallback?.onReceiveValue(uris)
        } else {
            fileChooserCallback?.onReceiveValue(null)
        }
        fileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Set status bar / navigation bar appearance
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#1A362B")
        window.navigationBarColor = Color.parseColor("#1A362B")

        // Handle System Back Button for WebView navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val wv = currentWebView
                if (wv != null && wv.canGoBack()) {
                    wv.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        setContent {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ComposeColor(0xFF1A362B))
                    .statusBarsPadding()
                    .navigationBarsPadding()
            ) {
                LewiHouseWebViewContainer(
                    onWebViewCreated = { webView ->
                        currentWebView = webView
                        handleIntentNavigation(intent, webView)
                    },
                    onOpenFileChooser = { callback, fileParams ->
                        fileChooserCallback?.onReceiveValue(null)
                        fileChooserCallback = callback
                        val intent = fileParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            type = "*/*"
                            addCategory(Intent.CATEGORY_OPENABLE)
                        }
                        try {
                            fileChooserLauncher.launch(intent)
                        } catch (e: Exception) {
                            fileChooserCallback?.onReceiveValue(null)
                            fileChooserCallback = null
                        }
                    }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        currentWebView?.let { handleIntentNavigation(intent, it) }
    }

    private fun handleIntentNavigation(intent: Intent?, webView: WebView) {
        val target = intent?.getStringExtra("NAVIGATE_TO")
        if (target == "CHAT") {
            webView.evaluateJavascript(
                "if (window.location.pathname !== '/chat') { window.location.href = '/chat'; }",
                null
            )
        }
    }

    override fun onDestroy() {
        currentWebView?.destroy()
        currentWebView = null
        super.onDestroy()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LewiHouseWebViewContainer(
    onWebViewCreated: (WebView) -> Unit,
    onOpenFileChooser: (ValueCallback<Array<Uri>>?, WebChromeClient.FileChooserParams?) -> Unit
) {
    val context = LocalContext.current

    val assetLoader = remember {
        WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    val webView = remember {
        WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#FDFBF7"))

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                loadsImagesAutomatically = true
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(false)
                displayZoomControls = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    val uri = request.url
                    if (uri.host == "appassets.androidplatform.net") {
                        val response = assetLoader.shouldInterceptRequest(uri)
                        if (response != null) return response

                        // SPA fallback: Route all non-file paths to index.html
                        val path = uri.path.orEmpty()
                        if (!path.contains(".") || path.endsWith(".html")) {
                            val indexUri = Uri.parse("https://appassets.androidplatform.net/assets/web/index.html")
                            return assetLoader.shouldInterceptRequest(indexUri)
                        }
                    }
                    return super.shouldInterceptRequest(view, request)
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    onOpenFileChooser(filePathCallback, fileChooserParams)
                    return true
                }
            }

            loadUrl("https://appassets.androidplatform.net/assets/web/index.html")
        }
    }

    DisposableEffect(Unit) {
        onWebViewCreated(webView)
        onDispose {
            webView.stopLoading()
        }
    }

    AndroidView(
        factory = { webView },
        modifier = Modifier.fillMaxSize()
    )
}
