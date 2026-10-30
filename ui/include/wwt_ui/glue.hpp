#pragma once
#include <string>
#include <vector>
#include <functional>

namespace wwt_ui {

struct DOMCommand {
  enum Type { SET_TEXT, SET_ATTR, ADD_CLASS, REMOVE_CLASS, APPEND_CHILD, REMOVE_CHILD };
  Type type;
  std::string selector;
  std::string value;
};

class Glue {
public:
  static void pushCommand(const DOMCommand& cmd);
  static void resolveCommands();
  
  static void emitEvent(const std::string& eventName, const std::string& payload);
  static std::string fetchNet(const std::string& url);
  static void setStorage(const std::string& key, const std::string& value);
  static std::string getStorage(const std::string& key);
};

}
