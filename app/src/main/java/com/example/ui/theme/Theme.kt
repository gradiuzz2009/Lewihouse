package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = DarkNavyPrimary,
    onPrimary = Navy900,
    primaryContainer = Navy700,
    onPrimaryContainer = Navy100,
    secondary = DarkNavySecondary,
    onSecondary = Navy900,
    secondaryContainer = Gold600,
    onSecondaryContainer = Gold100,
    tertiary = Emerald500,
    onTertiary = Color.White,
    background = DarkNavyBg,
    onBackground = Color(0xFFF1F5F9),
    surface = DarkNavySurface,
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = DarkNavySurfaceVariant,
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = DarkNavyOutline,
    error = Rose600,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = Navy800,
    onPrimary = Color.White,
    primaryContainer = Navy100,
    onPrimaryContainer = Navy900,
    secondary = Gold500,
    onSecondary = Color.White,
    secondaryContainer = Gold100,
    onSecondaryContainer = Gold600,
    tertiary = Emerald600,
    onTertiary = Color.White,
    background = SleekBg,
    onBackground = SleekTextPrimary,
    surface = SleekSurface,
    onSurface = SleekTextPrimary,
    surfaceVariant = Slate100,
    onSurfaceVariant = SleekTextSecondary,
    outline = SleekBorder,
    error = Rose600,
    onError = Color.White
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Use intentional Nusantara Property Ledger brand colors
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
