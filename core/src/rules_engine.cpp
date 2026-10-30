#include "wwt/order.hpp"
#include <algorithm>

namespace wwt {

bool ResearchTree::canResearch(const NationView& nation, const std::string& branch, int target) {
  if (target < 1 || target > kResearchMax) return false;
  // ponytail: Simplified research tree. Add complex dependencies when spec is provided.
  return true; 
}

int ResearchTree::getResearchCost(const std::string& branch, int target) {
  return kResearchIc;
}

bool RulesEngine::checkTreaty(const std::string& treatyType, int roll) {
  // ponytail: Generic treaty check.
  return roll >= 4;
}

bool RulesEngine::checkBlockade(const std::string& target, int roll) {
  // ponytail: Generic blockade check.
  return roll >= 5;
}

}
