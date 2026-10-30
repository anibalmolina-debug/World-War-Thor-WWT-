#include "wwt_ui/app.hpp"
#include "wwt_ui/glue.hpp"
#include "wwt/version.hpp"
#include <cstdio>
#include <cstring>

extern "C" void wwt_ui_init(void) {
  wwt_ui::Glue::emitEvent("wwt:init", wwt::kCoreVersion);
}

extern "C" void wwt_ui_event(const char* json) {
  if (!json) return;
  // ponytail: minimal routing. Add JSON parser when F2 is fully integrated with JS.
  wwt_ui::Glue::pushCommand({wwt_ui::DOMCommand::SET_TEXT, "#status", "Event received"});
  wwt_ui::Glue::resolveCommands();
}
