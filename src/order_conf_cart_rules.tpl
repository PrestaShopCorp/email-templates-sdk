{foreach $list as $cart_rule}
    <tr class="conf_body">
        <td colspan="3" align="left" style="padding: 10px 0;">
            <font size="2" face="Arial, sans-serif" color="#777777">
                <p class="name-product" style="margin: 0; padding: 0; font-size: 13px; color: #777777; font-weight: bold;">{$cart_rule['voucher_name']}</p>
            </font>
        </td>
        <td colspan="2" align="right" style="padding: 10px 0;">
            <font size="2" face="Arial, sans-serif" color="#777777">
                <p style="margin: 0; padding: 0; font-size: 13px">{$cart_rule['voucher_reduction']}</p>
            </font>
        </td>
    </tr>
{/foreach}
