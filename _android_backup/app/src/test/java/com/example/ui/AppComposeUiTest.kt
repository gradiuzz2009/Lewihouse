package com.example.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.ui.screens.login.LoginScreen
import com.example.ui.theme.LewiHouseTheme
import com.example.ui.viewmodels.AppViewModel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class AppComposeUiTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testLoginScreenDisplaysTenantAndAdminTabs() {
        val mockViewModel = mock(AppViewModel::class.java)
        val strings = LanguageManager.getStrings(AppLanguage.EN)

        composeTestRule.setContent {
            LewiHouseTheme {
                LoginScreen(
                    viewModel = mockViewModel,
                    strings = strings,
                    language = AppLanguage.EN,
                    onLoginSuccess = {}
                )
            }
        }

        // Verify elements on Login screen
        composeTestRule.onNodeWithText("Lewi House").assertIsDisplayed()
        composeTestRule.onNodeWithText("Tenant").assertIsDisplayed()
        composeTestRule.onNodeWithText("Admin").assertIsDisplayed()
    }
}
