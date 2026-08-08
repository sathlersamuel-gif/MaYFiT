package com.mayfit.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

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

        // Mantém a barra de navegação do Android separada visualmente do MaYFiT.
        getWindow().setNavigationBarColor(Color.BLACK);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            getWindow(),
            getWindow().getDecorView()
        );
        controller.setAppearanceLightNavigationBars(false);

        // Reserva fisicamente a área dos botões/gestos do Android fora do WebView.
        // Isso evita que a navegação inferior do MaYFiT fique atrás do sistema,
        // mesmo em aparelhos onde a safe-area do CSS retorna zero.
        View content = findViewById(android.R.id.content);
        final int initialLeft = content.getPaddingLeft();
        final int initialTop = content.getPaddingTop();
        final int initialRight = content.getPaddingRight();
        final int initialBottom = content.getPaddingBottom();

        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets navigationBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
            view.setPadding(
                initialLeft,
                initialTop,
                initialRight,
                initialBottom + navigationBars.bottom
            );
            return windowInsets;
        });

        ViewCompat.requestApplyInsets(content);
    }
}
