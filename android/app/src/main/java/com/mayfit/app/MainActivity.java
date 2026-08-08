package com.mayfit.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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

        final View webView = bridge.getWebView();
        final View content = findViewById(android.R.id.content);
        content.setBackgroundColor(Color.BLACK);
        webView.setBackgroundColor(Color.BLACK);

        final ViewGroup.LayoutParams rawParams = webView.getLayoutParams();
        final int initialBottomMargin = rawParams instanceof ViewGroup.MarginLayoutParams
            ? ((ViewGroup.MarginLayoutParams) rawParams).bottomMargin
            : 0;

        // Xiaomi / POCO / MIUI / HyperOS podem reportar a barra de 3 botões de forma
        // diferente do WebView. Em vez de depender de safe-area CSS, reduzimos fisicamente
        // a altura útil do WebView usando o maior inset de navegação/touch do Android.
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets navigationBars = windowInsets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.navigationBars()
            );
            Insets tappable = windowInsets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.tappableElement()
            );
            Insets mandatoryGestures = windowInsets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.mandatorySystemGestures()
            );

            int bottomInset = Math.max(
                navigationBars.bottom,
                Math.max(tappable.bottom, mandatoryGestures.bottom)
            );

            // Fallback específico para aparelhos que usam navegação por botões mas
            // retornam inset 0 (caso observado em algumas versões MIUI/HyperOS).
            int navModeId = getResources().getIdentifier(
                "config_navBarInteractionMode",
                "integer",
                "android"
            );
            int navMode = navModeId > 0 ? getResources().getInteger(navModeId) : -1;
            if (bottomInset == 0 && navMode != 2) {
                int navHeightId = getResources().getIdentifier(
                    "navigation_bar_height",
                    "dimen",
                    "android"
                );
                if (navHeightId > 0) {
                    bottomInset = getResources().getDimensionPixelSize(navHeightId);
                }
            }

            ViewGroup.LayoutParams params = webView.getLayoutParams();
            if (params instanceof ViewGroup.MarginLayoutParams) {
                ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) params;
                int desiredBottomMargin = initialBottomMargin + bottomInset;
                if (margins.bottomMargin != desiredBottomMargin) {
                    margins.bottomMargin = desiredBottomMargin;
                    webView.setLayoutParams(margins);
                    webView.requestLayout();
                }
            }

            return windowInsets;
        });

        ViewCompat.requestApplyInsets(content);
    }
}
