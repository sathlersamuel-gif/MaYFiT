package com.mayfit.app;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayDeque;
import java.util.Locale;
import java.util.Queue;

@CapacitorPlugin(name = "NativeTts")
public class NativeTtsPlugin extends Plugin {
    private TextToSpeech tts;
    private volatile boolean ready = false;
    private final Queue<PendingSpeech> pending = new ArrayDeque<>();

    private static final class PendingSpeech {
        final PluginCall call;
        final String id;
        final String text;

        PendingSpeech(PluginCall call, String id, String text) {
            this.call = call;
            this.id = id;
            this.text = text;
        }
    }

    @Override
    public void load() {
        super.load();
        tts = new TextToSpeech(getContext(), status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) {
                ready = false;
                rejectPending("Não foi possível iniciar a voz do Android.");
                return;
            }

            tts.setLanguage(new Locale("pt", "BR"));
            tts.setSpeechRate(0.98f);
            tts.setPitch(1.02f);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    JSObject data = new JSObject();
                    data.put("id", utteranceId);
                    notifyListeners("ttsStart", data);
                }

                @Override
                public void onDone(String utteranceId) {
                    JSObject data = new JSObject();
                    data.put("id", utteranceId);
                    notifyListeners("ttsDone", data);
                }

                @Override
                public void onError(String utteranceId) {
                    JSObject data = new JSObject();
                    data.put("id", utteranceId);
                    notifyListeners("ttsError", data);
                }

                @Override
                public void onError(String utteranceId, int errorCode) {
                    JSObject data = new JSObject();
                    data.put("id", utteranceId);
                    data.put("errorCode", errorCode);
                    notifyListeners("ttsError", data);
                }
            });

            ready = true;
            getActivity().runOnUiThread(this::flushPending);
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String id = call.getString("id", "");
        if (text == null || text.trim().isEmpty() || id == null || id.trim().isEmpty()) {
            call.reject("Texto ou identificador de voz inválido.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (!ready || tts == null) {
                pending.add(new PendingSpeech(call, id, text));
                return;
            }
            speakNow(call, id, text);
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            pending.clear();
            if (tts != null) tts.stop();
            call.resolve();
        });
    }

    private void speakNow(PluginCall call, String id, String text) {
        int result = tts.speak(text, TextToSpeech.QUEUE_ADD, null, id);
        if (result == TextToSpeech.ERROR) {
            call.reject("O Android não conseguiu iniciar a fala.");
            return;
        }
        JSObject resultData = new JSObject();
        resultData.put("id", id);
        resultData.put("started", true);
        call.resolve(resultData);
    }

    private void flushPending() {
        while (ready && tts != null && !pending.isEmpty()) {
            PendingSpeech item = pending.poll();
            if (item != null) speakNow(item.call, item.id, item.text);
        }
    }

    private void rejectPending(String message) {
        getActivity().runOnUiThread(() -> {
            while (!pending.isEmpty()) {
                PendingSpeech item = pending.poll();
                if (item != null) item.call.reject(message);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        pending.clear();
        ready = false;
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        super.handleOnDestroy();
    }
}
