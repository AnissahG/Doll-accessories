// Runs after `npx cap add android` (the Android project is generated fresh on every build).
// Adds the HtmlPrint plugin: the web view inside an app has no print dialog, so "Print / PDF" hands the
// printable page to Android's own print service (any printer, or "Save as PDF") at true scale.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const appId = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8')).appId;
const javaDir = path.join(root, 'android', 'app', 'src', 'main', 'java', ...appId.split('.'));
fs.mkdirSync(javaDir, { recursive: true });
for (const f of fs.readdirSync(javaDir)) if (/^MainActivity\.(java|kt)$/.test(f)) fs.rmSync(path.join(javaDir, f));

fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), `package ${appId};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HtmlPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

fs.writeFileSync(path.join(javaDir, 'HtmlPrintPlugin.java'), `package ${appId};

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HtmlPrint")
public class HtmlPrintPlugin extends Plugin {
    // kept alive until Android's print service has read the page
    private WebView printView;

    @PluginMethod
    public void print(final PluginCall call) {
        final String html = call.getString("html");
        final String name = call.getString("name", "Pattern");
        final boolean letter = "Letter".equals(call.getString("paper", "A4"));
        if (html == null) {
            call.reject("Nothing to print");
            return;
        }
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                WebView view = new WebView(getActivity());
                view.getSettings().setJavaScriptEnabled(false);
                view.setWebViewClient(new WebViewClient() {
                    private boolean sent = false;

                    @Override
                    public void onPageFinished(WebView v, String url) {
                        if (sent) return;
                        sent = true;
                        try {
                            PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                            PrintDocumentAdapter adapter = v.createPrintDocumentAdapter(name);
                            PrintAttributes attrs = new PrintAttributes.Builder()
                                .setMediaSize(letter ? PrintAttributes.MediaSize.NA_LETTER : PrintAttributes.MediaSize.ISO_A4)
                                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                .build();
                            pm.print(name, adapter, attrs);
                            call.resolve();
                        } catch (Exception e) {
                            call.reject("Could not start printing: " + e.getMessage());
                        }
                    }
                });
                printView = view;
                view.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
            }
        });
    }
}
`);
console.log('Android project patched: HtmlPrint plugin');
