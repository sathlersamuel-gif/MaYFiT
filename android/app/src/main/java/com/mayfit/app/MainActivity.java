package com.mayfit.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowMetrics;

import androidx.annotation.NonNull;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View webView;
    private View contentView;
    private int initialBottomMargin = 0;

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

        ViewGroup.LayoutParams rawParams = webView.getLayoutParams();
        if (rawParams instanceof ViewGroup.MarginLayoutParams) {
            initialBottomMargin = ((ViewGroup.MarginLayoutParams) rawParams).bottomMargin;
        }

        installUniversalSystemInsetHandling();
    }

    /**
     * Ajuste único e automático para Android: usa apenas os insets informados pelo sistema.
     * Não depende de fabricante, modelo, resolução, densidade ou modo de navegação.
     */
    private void installUniversalSystemInsetHandling() {
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
            applyBottomInset(resolveBottomSystemInset(windowInsets));
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

        // Segunda leitura pelo WindowManager em Android 11+, ainda usando APIs oficiais.
        // Serve como redundância quando um WebView/OEM entrega um dos insets com atraso.
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

        // Em Android 9 e anteriores não existe navegação totalmente gestual moderna.
        // Se o sistema antigo não entregar inset, usa a própria dimensão de navegação dele.
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

    private void applyBottomInset(int bottomInset) {
        if (webView == null) return;

        ViewGroup.LayoutParams params = webView.getLayoutParams();
        if (!(params instanceof ViewGroup.MarginLayoutParams)) return;

        ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) params;
        int desiredBottomMargin = initialBottomMargin + bottomInset;
        if (margins.bottomMargin == desiredBottomMargin) return;

        margins.bottomMargin = desiredBottomMargin;
        webView.setLayoutParams(margins);
        webView.requestLayout();
    }

    private void requestFreshInsets() {
        if (contentView == null) return;
        ViewCompat.requestApplyInsets(contentView);
        contentView.post(() -> ViewCompat.requestApplyInsets(contentView));
    }

    @Override
    protected void onResume() {
        super.onResume();
        requestFreshInsets();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) requestFreshInsets();
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        requestFreshInsets();
    }
}
