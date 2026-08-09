package com.mayfit.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowMetrics;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WebView webView;
    private android.view.View contentView;
    private int lastBottomInsetPx = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeTtsPlugin.class);
        super.onCreate(savedInstanceState);

        getWindow().setNavigationBarColor(Color.BLACK);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            getWindow(),
            getWindow().getDecorView()
        );
        controller.setAppearanceLightNavigationBars(false);

        webView = bridge.getWebView();
        contentView = findViewById(android.R.id.content);
        contentView.setBackgroundColor(Color.BLACK);
        webView.setBackgroundColor(Color.BLACK);

        installUniversalSystemInsetHandling();
    }

    /**
     * Mede a área inferior real do Android e a publica para o CSS do MaYFiT.
     * Não depende de fabricante, modelo, resolução, densidade ou tipo de navegação.
     */
    private void installUniversalSystemInsetHandling() {
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
            lastBottomInsetPx = resolveBottomSystemInset(windowInsets);
            publishBottomInsetToWeb(lastBottomInsetPx);
            return windowInsets;
        });
        requestFreshInsets();
    }

    private int resolveBottomSystemInset(WindowInsetsCompat windowInsets) {
        Insets navigationBars = windowInsets.getInsetsIgnoringVisibility(
            WindowInsetsCompat.Type.navigationBars()
        );
        Insets tappableElements = windowInsets.getInsetsIgnoringVisibility(
            WindowInsetsCompat.Type.tappableElement()
        );
        Insets mandatoryGestures = windowInsets.getInsetsIgnoringVisibility(
            WindowInsetsCompat.Type.mandatorySystemGestures()
        );

        int bottomInset = Math.max(
            navigationBars.bottom,
            Math.max(tappableElements.bottom, mandatoryGestures.bottom)
        );

        // Leitura redundante pelo WindowManager em Android 11+.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowMetrics metrics = getWindowManager().getCurrentWindowMetrics();
            android.graphics.Insets platformInsets = metrics.getWindowInsets()
                .getInsetsIgnoringVisibility(
                    WindowInsets.Type.navigationBars()
                        | WindowInsets.Type.tappableElement()
                        | WindowInsets.Type.mandatorySystemGestures()
                );
            bottomInset = Math.max(bottomInset, platformInsets.bottom);
        }

        // Compatibilidade com Android 9 e anteriores.
        if (bottomInset == 0 && Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            int navHeightId = getResources().getIdentifier(
                "navigation_bar_height",
                "dimen",
                "android"
            );
            if (navHeightId > 0) {
                bottomInset = getResources().getDimensionPixelSize(navHeightId);
            }
        }

        return Math.max(0, bottomInset);
    }

    private void publishBottomInsetToWeb(int bottomInsetPx) {
        if (webView == null) return;

        float density = getResources().getDisplayMetrics().density;
        int cssPx = density > 0f ? Math.max(0, Math.round(bottomInsetPx / density)) : 0;
        String script = "(function(){" +
            "var r=document.documentElement;if(!r)return;" +
            "r.style.setProperty('--mayfit-native-bottom','" + cssPx + "px');" +
            "window.dispatchEvent(new CustomEvent('mayfit-native-insets',{detail:{bottom:" + cssPx + "}}));" +
            "})();";

        Runnable publish = () -> webView.evaluateJavascript(script, null);
        webView.post(publish);
        // Repete após o carregamento inicial da página remota do Capacitor.
        webView.postDelayed(publish, 250);
        webView.postDelayed(publish, 1000);
        webView.postDelayed(publish, 2500);
    }

    private void requestFreshInsets() {
        if (contentView == null) return;
        ViewCompat.requestApplyInsets(contentView);
        contentView.post(() -> ViewCompat.requestApplyInsets(contentView));
    }

    @Override
    public void onResume() {
        super.onResume();
        requestFreshInsets();
        publishBottomInsetToWeb(lastBottomInsetPx);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            requestFreshInsets();
            publishBottomInsetToWeb(lastBottomInsetPx);
        }
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        requestFreshInsets();
    }
}
