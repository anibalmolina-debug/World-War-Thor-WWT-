#pragma once

#include "wwt/order.hpp"

namespace wwt {

Budget budgetOf(const NationView& nation, const Order& order);

Validation validateOrder(const NationView& nation, const Order& order, bool locked = false);

}
