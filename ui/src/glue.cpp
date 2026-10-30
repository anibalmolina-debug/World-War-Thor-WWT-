#include "wwt_ui/glue.hpp"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <vector>
#include <string>

namespace wwt_ui {

static std::vector<DOMCommand> commandQueue;

void Glue::pushCommand(const DOMCommand& cmd) {
  commandQueue.push_back(cmd);
}

void Glue::resolveCommands() {
  // In a real emcc build, this would call JS functions via EM_ASM or val
  // ponytail: stubbed until the final JS-bridge implementation.
  commandQueue.clear();
}

void Glue::emitEvent(const std::string& eventName, const std::string& payload) {
  EM_ASM({
    window.dispatchEvent(new CustomEvent(UTF8ToString($0), { detail: UTF8ToString($1) }));
  }, eventName.c_str(), payload.c_str());
}

std::string Glue::fetchNet(const std::string& url) {
  // ponytail: Use synchronous fetch for simplicity in WASM, or async with a callback.
  // Standard fetch is async; this is a placeholder for the bridge.
  return "{}";
}

void Glue::setStorage(const std::string& key, const std::string& value) {
  EM_ASM({
    localStorage.setItem(UTF8ToString($0), UTF8ToString($1));
  }, key.c_str(), value.c_str());
}

std::string Glue::getStorage(const std::string& key) {
  char* res = (char*)EM_ASM_INT({
    var val = localStorage.getItem(UTF8ToString($0));
    if (!val) return 0;
    var buffer = allocate(intArrayFromString(val), 'i8', ALLOC_NORMAL);
    return buffer;
  }, key.c_str());
  
  if (!res) return "";
  std::string s(res);
  free(res);
  return s;
}

}
