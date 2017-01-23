{foreach $list as $product}
	<tr>
		<td style="padding: 10px 0;" width="18%">
			<font size="2" face="Arial, sans-serif" color="#919191">
				<p style="margin: 0; padding: 0 5px; font-size: 14px">{$product['reference']}</p>
			</font>
		</td>
		<td style="padding: 10px 0;" width="37%">
			<font size="2" face="Arial, sans-serif" color="#919191">
				<p class="name-product" style="margin: 0; padding: 0 5px; font-size: 14px; color: #919191; font-weight: bold;">{$product['name']}
					{if count($product['customization']) == 1}
						{foreach $product['customization'] as $customization}
							<span style="color: #565656 !important; font-weight: normal; display: block; line-height: 16px">{$customization['customization_text']}</span>
						{/foreach}
					{/if}
				</p>
				{hook h='displayProductPriceBlock' product=$product type="unit_price"}
			</font>
		</td>
		<td style="padding: 10px 0;" width="15%">
			<font size="2" face="Arial, sans-serif" color="#919191">
				<p style="margin: 0; padding: 0 5px; font-size: 14px">{$product['unit_price']}</p>
			</font>
		</td>
		<td style="padding: 10px 0;" width="15%">
			<font size="2" face="Arial, sans-serif" color="#919191">
				<p style="margin: 0; padding: 0 5px; font-size: 14px">{$product['quantity']}</p>
			</font>
		</td>
		<td align="right" style="padding: 10px 0;" width="15%">
			<font size="2" face="Arial, sans-serif" color="#919191">
				<p style="margin: 0; padding: 0 5px; font-size: 14px">{$product['price']}</p>
			</font>
		</td>
	</tr>
  {if count($product['customization']) > 1}
  	{foreach $product['customization'] as $customization}
  		<tr>
	  		<td colspan="3" style="padding: 10px 0;">
					<font size="2" face="Arial, sans-serif" color="#565656">
						<p style="margin: 0; padding: 0; font-size: 14px">{$customization['customization_text']}</p>
					</font>
	  		</td>
				<td colspan="2" align="left" style="padding: 10px 0;">
					<font size="2" face="Arial, sans-serif" color="#565656">
						{if count($product['customization']) > 1}
							<p style="margin: 0; padding: 0; font-size: 14px; text-align: left">{$customization['customization_quantity']}</p>
						{/if}
					</font>
				</td>
  		</tr>
  	{/foreach}
  {/if}
{/foreach}
