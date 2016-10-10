<tr>
	<td style="padding: 10px 0;">
		<font size="2" face="Arial, sans-serif" color="#777777">
			<p style="margin: 0; padding: 0; font-size: 13px">{$product['reference']}</p>
		</font>
	</td>
	<td style="padding: 10px 0;">
		<font size="2" face="Arial, sans-serif" color="#777777">
			<p class="name-product" style="margin: 0; padding: 0; font-size: 13px; color: #777777; font-weight: bold;">{$product['name']}
				{if count($product['customization']) == 1}
					{foreach $product['customization'] as $customization}
						<span style="color: #919191 !important; font-weight: normal; display: block; line-height: 16px">{$customization['customization_text']}</span>
					{/foreach}
				{/if}
			</p>
			{hook h='displayProductPriceBlock' product=$product type="unit_price"}
		</font>
	</td>
	<td style="padding: 10px 0;">
		<font size="2" face="Arial, sans-serif" color="#777777">
			<p style="margin: 0; padding: 0; font-size: 13px">{$product['unit_price']}</p>
		</font>
	</td>
	<td style="padding: 10px 0;">
		<font size="2" face="Arial, sans-serif" color="#777777">
			<p style="margin: 0; padding: 0; font-size: 13px">{$product['quantity']}</p>
		</font>
	</td>
	<td align="right" style="padding: 10px 0;">
		<font size="2" face="Arial, sans-serif" color="#777777">
			<p style="margin: 0; padding: 0; font-size: 13px">{$product['price']}</p>
		</font>
	</td>
</tr>
{if count($product['customization']) > 1}
	{foreach $product['customization'] as $customization}
		<tr>
			<td colspan="3" style="padding: 10px 0;">
				<font size="2" face="Arial, sans-serif" color="#777777">
					<p style="margin: 0; padding: 0; font-size: 13px">{$customization['customization_text']}</p>
				</font>
			</td>
			<td colspan="2" align="left" style="padding: 10px 0;">
				<font size="2" face="Arial, sans-serif" color="#777777">
					{if count($product['customization']) > 1}
						<p style="margin: 0; padding: 0; font-size: 13px">{$customization['customization_quantity']}</p>
					{/if}
				</font>
			</td>
		</tr>
