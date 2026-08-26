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
    onSecondaryContainer = Navy900,
    tertiary = Emerald500,
    onTertiary = Color.White,
    background = DarkNavyBg,
    onBackground = Color(0xFFFFFFFF),
    surface = DarkNavySurface,
    onSurface = Color(0xFFFFFFFF),
    surfaceVariant = DarkNavySurfaceVariant,
    onSurfaceVariant = Color(0xFFE2E8F0),
    outline = DarkNavyOutline,
    error = Rose600,
    onError = Color.White,
    surfaceTint = DarkNavyPrimary,
    inverseSurface = Color(0xFFE2E8F0),
    inverseOnSurface = Navy900,
    inversePrimary = Navy800,
    scrim = Color.Black.copy(alpha = 0.5f)
)

private val LightColorScheme = lightColorScheme(
    primary = Navy800,
    onPrimary = Color.White,
    primaryContainer = Navy100,
    onPrimaryContainer = Navy900,
    secondary = Gold500,
    onSecondary = Navy900,
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
    outline = Slate400,
    error = Rose600,
    onError = Color.White,
    surfaceTint = Navy800,
    inverseSurface = Navy900,
    inverseOnSurface = Color.White,
    inversePrimary = Color(0xFF93C5FD),
    scrim = Color.Black.copy(alpha = 0.5f)
)

@Composable
fun LewiHouseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true, // Use dynamic color on supported devices
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
